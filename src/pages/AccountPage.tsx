import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  Inbox,
  MessageCircle,
  Pencil,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Item, User } from "@/types";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import {
  deleteAccount,
  getAccountData,
  getMyClaims,
  getMyReports,
  updateNotificationPreferences,
  updateProfile,
} from "@/features/auth/auth.api";
import type { NotificationPreferences, UserClaim } from "@/features/auth/auth.types";
import { getMessageThreads } from "@/features/claims/claims.api";
import { deleteItem, updateItem } from "@/features/items/items.api";
import type { MessageThread } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";

type AccountTab = "reports" | "claims" | "messages" | "settings";

const tabLabels: Array<{ value: AccountTab; label: string; icon: typeof FileText }> = [
  { value: "reports", label: "My reports", icon: FileText },
  { value: "claims", label: "My claims", icon: CheckCircle2 },
  { value: "messages", label: "Messages", icon: MessageCircle },
  { value: "settings", label: "Settings", icon: Settings },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="account-error" role="alert">
      <CircleHelp size={20} />
      <p>We couldn’t load this section. Check your connection and try again.</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function EditReportForm({
  item,
  onSave,
  saving,
}: {
  item: Item;
  onSave: (updates: Pick<Item, "title" | "description" | "location">) => void;
  saving: boolean;
}) {
  const [values, setValues] = useState({
    title: item.title,
    description: item.description,
    location: item.location,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(values);
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <div className="auth-field">
        <label htmlFor="edit-report-title">Item title</label>
        <Input
          id="edit-report-title"
          value={values.title}
          minLength={4}
          maxLength={80}
          required
          onChange={(event) => setValues({ ...values, title: event.target.value })}
        />
      </div>
      <div className="auth-field">
        <label htmlFor="edit-report-location">Location</label>
        <Input
          id="edit-report-location"
          value={values.location}
          maxLength={100}
          required
          onChange={(event) => setValues({ ...values, location: event.target.value })}
        />
      </div>
      <div className="auth-field">
        <label htmlFor="edit-report-description">Description</label>
        <Textarea
          id="edit-report-description"
          value={values.description}
          minLength={15}
          maxLength={600}
          required
          rows={4}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
        />
      </div>
      <Button type="submit" loading={saving}>
        Save changes
      </Button>
    </form>
  );
}

function ReportActions({
  item,
  editing,
  deleting,
  deletingPending,
  saving,
  resolving,
  setEditing,
  setDeleting,
  onEdit,
  onDelete,
  onResolve,
}: {
  item: Item;
  editing: boolean;
  deleting: boolean;
  deletingPending: boolean;
  saving: boolean;
  resolving: boolean;
  setEditing: (open: boolean) => void;
  setDeleting: (open: boolean) => void;
  onEdit: (updates: Pick<Item, "title" | "description" | "location">) => void;
  onDelete: () => void;
  onResolve: () => void;
}) {
  return (
    <div className="account-row-actions">
      <Dialog
        trigger={
          <Button
            variant="secondary"
            size="sm"
            aria-label={`Edit ${item.title}`}
            onClick={() => setEditing(true)}
          >
            <Pencil size={14} /> Edit
          </Button>
        }
        open={editing}
        onOpenChange={setEditing}
        title="Edit your report"
        description="Keep the details up to date so your neighbors can help."
      >
        {editing && <EditReportForm key={item.id} item={item} onSave={onEdit} saving={saving} />}
      </Dialog>
      {item.status !== "returned" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onResolve}
          loading={resolving}
          aria-label={`Mark ${item.title} as resolved`}
        >
          <Check size={14} /> Resolve
        </Button>
      )}
      <Dialog
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="account-delete-action"
            aria-label={`Delete ${item.title}`}
            onClick={() => setDeleting(true)}
          >
            <Trash2 size={14} /> Delete
          </Button>
        }
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this report?"
        description="This removes the listing from the neighborhood board. This action cannot be undone."
      >
        <div className="account-dialog-actions">
          <Button variant="secondary" onClick={() => setDeleting(false)}>
            Keep report
          </Button>
          <Button variant="danger" loading={deletingPending} onClick={onDelete}>
            Delete report
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function ReportsTab({
  items,
  isLoading,
  isError,
  refetch,
  editId,
  deleteId,
  setEditId,
  setDeleteId,
  update,
  remove,
  resolve,
  busyId,
  saving,
}: {
  items: Item[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  editId: string | null;
  deleteId: string | null;
  setEditId: (id: string | null) => void;
  setDeleteId: (id: string | null) => void;
  update: (id: string, updates: Pick<Item, "title" | "description" | "location">) => void;
  remove: (id: string) => void;
  resolve: (id: string) => void;
  busyId: string | null;
  saving: boolean;
}) {
  if (isLoading) return <p className="account-loading">Loading your reports…</p>;
  if (isError) return <QueryError onRetry={refetch} />;
  if (!items.length) {
    return (
      <EmptyState
        icon={<Inbox size={25} />}
        title="Your noticeboard starts here"
        description="When you report a lost or found item, it will be saved here so you can keep it up to date."
        action={
          <div className="account-empty-actions">
            <Link className="ui-button ui-button--primary" to="/report/lost">
              <Plus size={15} /> Report something lost
            </Link>
            <Link className="ui-button ui-button--secondary" to="/report/found">
              I found something
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <>
      <div className="account-table-wrap">
        <table className="account-table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Reported</th>
              <th scope="col">Status</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link className="account-item-name" to={`/items/${item.id}`}>
                    {item.title}
                  </Link>
                  <span className="account-item-meta">{item.location}</span>
                </td>
                <td>{formatDate(item.date)}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td>
                  <ReportActions
                    item={item}
                    editing={editId === item.id}
                    deleting={deleteId === item.id}
                    deletingPending={busyId === item.id}
                    saving={saving}
                    resolving={busyId === item.id}
                    setEditing={(open) => setEditId(open ? item.id : null)}
                    setDeleting={(open) => setDeleteId(open ? item.id : null)}
                    onEdit={(updates) => update(item.id, updates)}
                    onDelete={() => remove(item.id)}
                    onResolve={() => resolve(item.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="account-report-cards">
        {items.map((item) => (
          <article className="account-report-card" key={item.id}>
            <div className="account-report-card-top">
              <StatusBadge status={item.status} />
              <span>{formatDate(item.date)}</span>
            </div>
            <Link className="account-item-name" to={`/items/${item.id}`}>
              {item.title}
            </Link>
            <p>{item.location}</p>
            <div className="account-mobile-actions">
              <Button variant="secondary" size="sm" onClick={() => setEditId(item.id)}>
                <Pencil size={14} /> Edit
              </Button>
              {item.status !== "returned" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resolve(item.id)}
                  loading={busyId === item.id}
                >
                  <Check size={14} /> Resolve
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)}>
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function ClaimsTab({
  claims,
  isLoading,
  isError,
  refetch,
}: {
  claims: UserClaim[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}) {
  if (isLoading) return <p className="account-loading">Loading your claims…</p>;
  if (isError) return <QueryError onRetry={refetch} />;
  if (!claims.length) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={25} />}
        title="No claims yet"
        description="If you recognize an item on the board, send a claim and you’ll be able to follow it here."
        action={
          <Link className="ui-button ui-button--primary" to="/items">
            Browse the noticeboard
          </Link>
        }
      />
    );
  }
  return (
    <div className="account-list">
      {claims.map(({ claim, item }) => (
        <article className="account-list-card" key={claim.id}>
          <div>
            <span
              className={`account-claim-status account-claim-status--${claim.status ?? "pending"}`}
            >
              {(claim.status ?? "submitted").replace("_", " ")}
            </span>
            <h3>
              <Link to={`/items/${item.id}`}>{item.title}</Link>
            </h3>
            <p>{claim.details}</p>
            <span className="account-item-meta">
              Claim sent {claim.createdAt ? formatDate(claim.createdAt.slice(0, 10)) : "recently"}
            </span>
          </div>
          <Link
            className="account-inline-link"
            to={`/claims/${claim.id}`}
            aria-label={`Track claim for ${item.title}`}
          >
            Track claim <ChevronRight size={15} />
          </Link>
        </article>
      ))}
    </div>
  );
}

function MessagesTab({
  threads,
  isLoading,
  isError,
  refetch,
}: {
  threads: MessageThread[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}) {
  if (isLoading) return <p className="account-loading">Loading your messages…</p>;
  if (isError) return <QueryError onRetry={refetch} />;
  if (!threads.length) {
    return (
      <EmptyState
        icon={<MessageCircle size={25} />}
        title="No conversations yet"
        description="Messages about your listings will appear here. You can also reach out to a neighbor about an item."
        action={
          <Link className="ui-button ui-button--primary" to="/items">
            Find an item
          </Link>
        }
      />
    );
  }
  return (
    <div className="account-list">
      {threads.map((thread) => (
        <article className="account-list-card" key={thread.id}>
          <div>
            <h3>
              <Link to={`/messages/${thread.id}`}>
                {thread.otherParticipantName} · {thread.itemTitle}
              </Link>
            </h3>
            <p>{thread.lastMessage?.body ?? "Conversation started with your claim."}</p>
            {thread.lastMessage && (
              <span className="account-item-meta">
                {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
                  new Date(thread.lastMessage.createdAt),
                )}
              </span>
            )}
          </div>
          <Link className="account-inline-link" to={`/messages/${thread.id}`}>
            {thread.unreadCount > 0 && (
              <span className="thread-unread-count">{thread.unreadCount} unread</span>
            )}
            Open thread <ChevronRight size={15} />
          </Link>
        </article>
      ))}
    </div>
  );
}

function SettingsTab({
  profile,
  preferences,
  isLoading,
  isError,
  refetch,
  onProfileSaved,
  onPreferencesSaved,
  onDeleteAccount,
  deleting,
}: {
  profile: User | undefined;
  preferences: NotificationPreferences | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  onProfileSaved: (profile: Pick<User, "name" | "email">) => Promise<void>;
  onPreferencesSaved: (preferences: NotificationPreferences) => void;
  onDeleteAccount: () => void;
  deleting: boolean;
}) {
  const { preference, setTheme } = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [formError, setFormError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
    setEmail(profile?.email ?? "");
  }, [profile?.name, profile?.email]);

  if (isLoading) return <p className="account-loading">Loading your settings…</p>;
  if (isError || !profile || !preferences) return <QueryError onRetry={refetch} />;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSavingProfile(true);
    try {
      await onProfileSaved({ name: name.trim(), email: email.trim() });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Your profile could not be saved.");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="account-settings">
      <section className="account-settings-section">
        <div className="account-section-heading">
          <h2>Profile</h2>
          <p>How neighbors can recognize and contact you.</p>
        </div>
        <form className="account-form account-profile-form" onSubmit={saveProfile}>
          {formError && (
            <p className="auth-form-error" role="alert">
              {formError}
            </p>
          )}
          <div className="auth-field">
            <label htmlFor="profile-name">Name</label>
            <Input
              id="profile-name"
              value={name}
              minLength={2}
              maxLength={60}
              required
              onChange={(event) => {
                setName(event.target.value);
                setFormError("");
              }}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="profile-email">Email address</label>
            <Input
              id="profile-email"
              type="email"
              autoComplete="email"
              value={email}
              required
              onChange={(event) => {
                setEmail(event.target.value);
                setFormError("");
              }}
            />
          </div>
          <Button type="submit" variant="secondary" loading={savingProfile}>
            Save profile
          </Button>
        </form>
      </section>

      <section className="account-settings-section">
        <div className="account-section-heading">
          <h2>Notifications</h2>
          <p>Choose which updates you’d like to receive.</p>
        </div>
        <div className="account-preferences">
          {(
            [
              [
                "emailUpdates",
                "Report updates",
                "Get notified when something changes on your reports.",
              ],
              [
                "claimMessages",
                "Claims and messages",
                "Hear when a neighbor responds to your claim.",
              ],
              [
                "communityNews",
                "Community news",
                "Occasional notes about what’s happening nearby.",
              ],
            ] as const
          ).map(([key, title, description]) => (
            <div className="account-preference-row" key={key}>
              <div>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
              <div className="account-preference-toggle">
                <Checkbox
                  id={`preference-${key}`}
                  label={title}
                  checked={preferences[key]}
                  onCheckedChange={(checked) =>
                    onPreferencesSaved({ ...preferences, [key]: checked === true })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="account-settings-section">
        <div className="account-section-heading">
          <h2>Appearance</h2>
          <p>Set the theme for this device.</p>
        </div>
        <div className="account-theme-choice">
          <label htmlFor="theme-preference">Theme preference</label>
          <Select
            id="theme-preference"
            value={preference}
            onValueChange={(value) => {
              if (value === "light" || value === "dark" || value === "system") setTheme(value);
            }}
            options={[
              { value: "system", label: "Use device setting" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </div>
      </section>

      <section className="account-danger-zone">
        <div>
          <h2>Delete account</h2>
          <p>Your profile and reports will be permanently removed.</p>
        </div>
        <Dialog
          trigger={
            <Button variant="danger">
              <Trash2 size={15} /> Delete account
            </Button>
          }
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete your account?"
          description="Your profile, reports, claims, and messages will be removed. This can’t be undone."
        >
          <div className="account-dialog-actions">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Keep my account
            </Button>
            <Button variant="danger" loading={deleting} onClick={onDeleteAccount}>
              Delete account
            </Button>
          </div>
        </Dialog>
      </section>
    </div>
  );
}

export function AccountPage() {
  const { user, signOut, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AccountTab>("reports");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const reports = useQuery({ queryKey: ["account", "reports"], queryFn: getMyReports });
  const claims = useQuery({ queryKey: ["account", "claims"], queryFn: getMyClaims });
  const messages = useQuery({ queryKey: ["message-threads"], queryFn: getMessageThreads });
  const account = useQuery({ queryKey: ["account", "profile"], queryFn: getAccountData });

  const invalidateAccount = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["account"] }),
      queryClient.invalidateQueries({ queryKey: ["items"] }),
      queryClient.invalidateQueries({ queryKey: ["home-stats"] }),
    ]);

  const saveItem = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Pick<Item, "title" | "description" | "location">;
    }) => updateItem(id, updates),
    onSuccess: async () => {
      setEditingId(null);
      toast({ title: "Report updated", description: "Your changes are saved.", kind: "success" });
      await invalidateAccount();
    },
    onError: (error) =>
      toast({ title: "Couldn’t update report", description: error.message, kind: "danger" }),
  });
  const removeItem = useMutation({
    mutationFn: deleteItem,
    onMutate: (id) => setBusyId(id),
    onSuccess: async () => {
      setDeletingId(null);
      toast({ title: "Report deleted", kind: "success" });
      await invalidateAccount();
    },
    onError: (error) =>
      toast({ title: "Couldn’t delete report", description: error.message, kind: "danger" }),
    onSettled: () => setBusyId(null),
  });
  const resolveItem = useMutation({
    mutationFn: (id: string) => updateItem(id, { status: "returned" }),
    onMutate: (id) => setBusyId(id),
    onSuccess: async () => {
      toast({
        title: "Marked as resolved",
        description: "Thanks for closing the loop.",
        kind: "success",
      });
      await invalidateAccount();
    },
    onError: (error) =>
      toast({ title: "Couldn’t update report", description: error.message, kind: "danger" }),
    onSettled: () => setBusyId(null),
  });
  const saveProfile = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (updatedUser) => {
      updateUser(updatedUser);
      await invalidateAccount();
      toast({ title: "Profile saved", kind: "success" });
    },
  });
  const savePreferences = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(["account", "profile"], (current: typeof account.data) =>
        current ? { ...current, preferences } : current,
      );
    },
    onError: (error) =>
      toast({ title: "Couldn’t save preferences", description: error.message, kind: "danger" }),
  });
  const removeAccount = useMutation({ mutationFn: deleteAccount });

  async function confirmDeleteAccount() {
    try {
      await removeAccount.mutateAsync();
      signOut();
      await queryClient.clear();
      navigate("/", { replace: true });
    } catch (error) {
      toast({
        title: "Couldn’t delete account",
        description: error instanceof Error ? error.message : "Please try again.",
        kind: "danger",
      });
    }
  }

  const selectedTab = tabLabels.find((tab) => tab.value === activeTab);
  const preferenceData = account.data?.preferences;

  return (
    <section className="account-page">
      <header className="account-page-heading">
        <div>
          <p className="auth-eyebrow">YOUR NEIGHBORHOOD</p>
          <h1>Your account</h1>
          <p className="account-welcome">Welcome back, {user?.name.split(" ")[0] ?? "neighbor"}.</p>
        </div>
        <Link className="ui-button ui-button--secondary" to="/report/lost">
          <Plus size={15} /> New report
        </Link>
      </header>

      <div className="account-tabs" role="tablist" aria-label="Account sections">
        {tabLabels.map(({ value, label, icon: Icon }) => (
          <button
            className={`account-tab${activeTab === value ? " is-active" : ""}`}
            key={value}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            aria-controls={`account-panel-${value}`}
            id={`account-tab-${value}`}
            onClick={() => setActiveTab(value)}
          >
            <Icon size={16} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      <section
        className="account-panel"
        id={`account-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`account-tab-${activeTab}`}
        tabIndex={0}
      >
        <div className="account-panel-heading">
          <div>
            <h2>{selectedTab?.label}</h2>
            <p>
              {activeTab === "reports" && "Keep your community listings current."}
              {activeTab === "claims" && "Follow up on the items you’re hoping to bring home."}
              {activeTab === "messages" && "Your conversations with other neighbors."}
              {activeTab === "settings" && "Make your account feel like yours."}
            </p>
          </div>
          {activeTab === "reports" && reports.data?.length ? (
            <span className="account-count">
              {reports.data.length} {reports.data.length === 1 ? "report" : "reports"}
            </span>
          ) : null}
        </div>

        {activeTab === "reports" && (
          <ReportsTab
            items={reports.data ?? []}
            isLoading={reports.isLoading}
            isError={reports.isError}
            refetch={() => void reports.refetch()}
            editId={editingId}
            deleteId={deletingId}
            setEditId={setEditingId}
            setDeleteId={setDeletingId}
            update={(id, updates) => saveItem.mutate({ id, updates })}
            remove={(id) => removeItem.mutate(id)}
            resolve={(id) => resolveItem.mutate(id)}
            busyId={busyId}
            saving={saveItem.isPending}
          />
        )}
        {activeTab === "claims" && (
          <ClaimsTab
            claims={claims.data ?? []}
            isLoading={claims.isLoading}
            isError={claims.isError}
            refetch={() => void claims.refetch()}
          />
        )}
        {activeTab === "messages" && (
          <MessagesTab
            threads={messages.data ?? []}
            isLoading={messages.isLoading}
            isError={messages.isError}
            refetch={() => void messages.refetch()}
          />
        )}
        {activeTab === "settings" && (
          <SettingsTab
            profile={account.data?.profile}
            preferences={preferenceData}
            isLoading={account.isLoading}
            isError={account.isError}
            refetch={() => void account.refetch()}
            onProfileSaved={async (profile) => {
              await saveProfile.mutateAsync(profile);
            }}
            onPreferencesSaved={(preferences) => savePreferences.mutate(preferences)}
            onDeleteAccount={() => void confirmDeleteAccount()}
            deleting={removeAccount.isPending}
          />
        )}
      </section>
    </section>
  );
}
