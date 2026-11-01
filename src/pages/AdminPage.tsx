import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  FileCheck2,
  LayoutDashboard,
  Plus,
  Search,
  Shield,
  Tags,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import {
  addAdminCategory,
  getAdminData,
  reviewAdminClaim,
  updateAdminReports,
  updateAdminUser,
  deleteAdminCategory,
  type AdminReport,
  type ReportAction,
} from "@/features/admin/admin.api";
import "@/styles/admin.css";

type AdminTab = "overview" | "reports" | "claims" | "users" | "audit";

const tabs: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "reports", label: "Reports queue", icon: ClipboardList },
  { id: "claims", label: "Claims review", icon: FileCheck2 },
  { id: "users", label: "Users & categories", icon: Users },
  { id: "audit", label: "Audit log", icon: Activity },
];

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function AdminPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("pending");
  const [sortDirection, setSortDirection] = useState<"newest" | "oldest">("newest");
  const [reviewNote, setReviewNote] = useState("");
  const [claimReason, setClaimReason] = useState("");
  const [selectedClaimId, setSelectedClaimId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const adminQuery = useQuery({
    queryKey: ["admin-data"],
    queryFn: getAdminData,
    refetchOnMount: "always",
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-data"] }),
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
    ]);
  };
  const reportMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ReportAction }) =>
      updateAdminReports(ids, status, reviewNote.trim() || "Reviewed from the admin queue."),
    onSuccess: async () => {
      setSelectedReports([]);
      setSelectedReportId("");
      setReviewNote("");
      setActionError("");
      await refresh();
    },
    onError: (error) => setActionError(error.message),
  });
  const claimMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      reviewAdminClaim(id, status, claimReason.trim()),
    onSuccess: async () => {
      setClaimReason("");
      setActionError("");
      await refresh();
    },
    onError: (error) => setActionError(error.message),
  });
  const userMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: "member" | "admin" }) =>
      updateAdminUser(id, role),
    onSuccess: async () => {
      setActionError("");
      await refresh();
    },
    onError: (error) => setActionError(error.message),
  });
  const categoryMutation = useMutation({
    mutationFn: addAdminCategory,
    onSuccess: async () => {
      setCategoryName("");
      setActionError("");
      await refresh();
    },
    onError: (error) => setActionError(error.message),
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: refresh,
    onError: (error) => setActionError(error.message),
  });
  const data = adminQuery.data;
  const reports = useMemo(() => {
    const needle = reportSearch.trim().toLowerCase();
    return (data?.reports ?? [])
      .filter((report) => reportStatusFilter === "all" || report.status === reportStatusFilter)
      .filter(
        (report) =>
          !needle ||
          `${report.item.title} ${report.reason} ${report.details}`.toLowerCase().includes(needle),
      )
      .sort((left, right) => {
        const order = left.createdAt.localeCompare(right.createdAt);
        return sortDirection === "newest" ? -order : order;
      });
  }, [data?.reports, reportSearch, reportStatusFilter, sortDirection]);
  const selectedReport =
    reports.find((report) => report.id === selectedReportId) ??
    data?.reports.find((report) => report.id === selectedReportId);
  const pendingClaims = (data?.claims ?? []).filter(
    ({ claim }) => claim.status === "submitted" || claim.status === "under_review",
  );
  const selectedClaim =
    pendingClaims.find(({ claim }) => claim.id === selectedClaimId) ?? pendingClaims[0];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (event.key === "Escape") {
        setHelpOpen(false);
        setSelectedReportId("");
        return;
      }
      if (helpOpen) return;
      if (!typing && event.key === "?") {
        event.preventDefault();
        setHelpOpen(true);
      }
      if (typing || tab !== "reports" || !reports.length) return;
      const currentIndex = reports.findIndex((report) => report.id === selectedReportId);
      if (event.key === "j" || event.key === "k") {
        event.preventDefault();
        const nextIndex =
          currentIndex < 0
            ? 0
            : (currentIndex + (event.key === "j" ? 1 : -1) + reports.length) % reports.length;
        setSelectedReportId(reports[nextIndex].id);
      }
      if (["a", "r", "d"].includes(event.key)) {
        const targetId = selectedReports[0] ?? selectedReportId;
        if (!targetId) return;
        const status: ReportAction =
          event.key === "a" ? "approved" : event.key === "r" ? "rejected" : "duplicate";
        reportMutation.mutate({
          ids: selectedReports.length ? selectedReports : [targetId],
          status,
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpOpen, reports, reportMutation, selectedReportId, selectedReports, tab]);

  function actOnReports(status: ReportAction, ids = selectedReports) {
    if (!ids.length) {
      setActionError("Select one or more reports first.");
      return;
    }
    reportMutation.mutate({ ids, status });
  }

  function toggleReport(id: string) {
    setSelectedReports((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (categoryName.trim()) categoryMutation.mutate(categoryName.trim());
  }

  if (adminQuery.isLoading) {
    return <section className="admin-loading">Loading administration console…</section>;
  }
  if (adminQuery.isError || !data) {
    return (
      <section className="admin-loading" role="alert">
        <AlertTriangle size={18} /> Could not load the admin console.
        <Button size="sm" variant="secondary" onClick={() => void adminQuery.refetch()}>
          Retry
        </Button>
      </section>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Shield size={17} /> <span>CG / OPS</span>
          <small>ADMIN CONSOLE</small>
        </div>
        <nav aria-label="Admin sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              className={tab === id ? "is-active" : ""}
              key={id}
              onClick={() => setTab(id)}
              type="button"
            >
              <Icon size={16} />
              {label}
              {id === "reports" && data.overview.reportsNeedingReview > 0 && (
                <span className="admin-nav-count">{data.overview.reportsNeedingReview}</span>
              )}
            </button>
          ))}
        </nav>
        <button className="admin-help-button" type="button" onClick={() => setHelpOpen(true)}>
          <CircleHelp size={15} /> Keyboard shortcuts <kbd>?</kbd>
        </button>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>COMMON GROUND / ADMIN</span>
            <h1>{tabs.find((item) => item.id === tab)?.label}</h1>
          </div>
          <button type="button" className="admin-refresh" onClick={() => void refresh()}>
            Refresh data <ChevronDown size={14} />
          </button>
        </header>
        {actionError && (
          <div className="admin-alert" role="alert">
            <AlertTriangle size={16} /> {actionError}
            <button type="button" aria-label="Dismiss error" onClick={() => setActionError("")}>
              <X size={15} />
            </button>
          </div>
        )}

        {tab === "overview" && (
          <section className="admin-section">
            <div className="admin-stat-grid">
              {Object.entries(data.overview.counts).map(([status, count]) => (
                <article className="admin-stat" key={status}>
                  <span>{status.replace("_", " ")}</span>
                  <strong>{count}</strong>
                  <small>listings</small>
                </article>
              ))}
              <article className="admin-stat admin-stat--alert">
                <span>Reports to review</span>
                <strong>{data.overview.reportsNeedingReview}</strong>
                <small>open moderation flags</small>
              </article>
              <article className="admin-stat admin-stat--alert">
                <span>Claims to review</span>
                <strong>{data.overview.claimsNeedingReview}</strong>
                <small>awaiting a decision</small>
              </article>
            </div>
            <section className="admin-panel">
              <header className="admin-panel-heading">
                <h2>Recent activity</h2>
                <span>Latest admin actions</span>
              </header>
              <AuditTable entries={data.overview.recentActivity} compact />
            </section>
          </section>
        )}

        {tab === "reports" && (
          <section className="admin-section admin-reports-layout">
            <div className="admin-panel admin-reports-panel">
              <header className="admin-panel-heading">
                <div>
                  <h2>Listing reports</h2>
                  <span>{reports.length} matching reports</span>
                </div>
                <div className="admin-table-tools">
                  <label className="admin-search">
                    <Search size={14} />
                    <input
                      aria-label="Search reports"
                      value={reportSearch}
                      onChange={(event) => setReportSearch(event.target.value)}
                      placeholder="Search reports"
                    />
                  </label>
                  <select
                    aria-label="Filter report status"
                    value={reportStatusFilter}
                    onChange={(event) => setReportStatusFilter(event.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="duplicate">Duplicate</option>
                    <option value="all">All statuses</option>
                  </select>
                </div>
              </header>
              <div className="admin-bulk-toolbar">
                <span>{selectedReports.length} selected</span>
                <input
                  aria-label="Review reason"
                  placeholder="Optional review note"
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                />
                <Button size="sm" onClick={() => actOnReports("approved")}>
                  <Check size={14} /> Approve
                </Button>
                <Button size="sm" variant="secondary" onClick={() => actOnReports("rejected")}>
                  Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => actOnReports("duplicate")}>
                  Mark duplicate
                </Button>
              </div>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          aria-label="Select all visible reports"
                          type="checkbox"
                          checked={
                            Boolean(reports.length) &&
                            reports.every((entry) => selectedReports.includes(entry.id))
                          }
                          onChange={(event) =>
                            setSelectedReports(
                              event.target.checked ? reports.map((entry) => entry.id) : [],
                            )
                          }
                        />
                      </th>
                      <th>Listing</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>
                        <button
                          className="admin-sort"
                          type="button"
                          onClick={() =>
                            setSortDirection((value) => (value === "newest" ? "oldest" : "newest"))
                          }
                        >
                          Reported <ChevronDown size={12} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr
                        key={report.id}
                        className={selectedReportId === report.id ? "is-selected" : ""}
                        onClick={() => setSelectedReportId(report.id)}
                      >
                        <td onClick={(event) => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${report.item.title}`}
                            checked={selectedReports.includes(report.id)}
                            onChange={() => toggleReport(report.id)}
                          />
                        </td>
                        <td>
                          <button
                            className="admin-row-link"
                            type="button"
                            onClick={() => setSelectedReportId(report.id)}
                          >
                            {report.item.title}
                          </button>
                          <small>{report.item.id}</small>
                        </td>
                        <td>{report.reason}</td>
                        <td>
                          <span className={`admin-status admin-status--${report.status}`}>
                            {report.status}
                          </span>
                        </td>
                        <td>{dateTime(report.createdAt)}</td>
                      </tr>
                    ))}
                    {!reports.length && (
                      <tr>
                        <td className="admin-empty-cell" colSpan={5}>
                          No reports match this view.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedReport && (
              <ReportDrawer
                report={selectedReport}
                onClose={() => setSelectedReportId("")}
                onAction={(status) => actOnReports(status, [selectedReport.id])}
                pending={reportMutation.isPending}
              />
            )}
          </section>
        )}

        {tab === "claims" && (
          <section className="admin-section">
            <div className="admin-panel">
              <header className="admin-panel-heading">
                <div>
                  <h2>Claims requiring review</h2>
                  <span>{pendingClaims.length} open claims</span>
                </div>
                <select
                  aria-label="Select claim"
                  value={selectedClaim?.claim.id ?? ""}
                  onChange={(event) => setSelectedClaimId(event.target.value)}
                >
                  {pendingClaims.map(({ claim, item }) => (
                    <option key={claim.id} value={claim.id}>
                      {item.title} — {claim.name}
                    </option>
                  ))}
                </select>
              </header>
              {!selectedClaim ? (
                <p className="admin-empty">No claims are waiting for review.</p>
              ) : (
                <>
                  <div className="admin-claim-compare">
                    <article>
                      <span className="admin-eyebrow">ORIGINAL LISTING</span>
                      <h3>{selectedClaim.item.title}</h3>
                      <dl>
                        <dt>Status</dt>
                        <dd>{selectedClaim.item.status}</dd>
                        <dt>Category</dt>
                        <dd>{selectedClaim.item.category}</dd>
                        <dt>Location</dt>
                        <dd>{selectedClaim.item.location}</dd>
                        <dt>Description</dt>
                        <dd>{selectedClaim.item.description}</dd>
                        {selectedClaim.item.image && (
                          <img
                            src={selectedClaim.item.image}
                            alt={`Listing: ${selectedClaim.item.title}`}
                            width={640}
                            height={480}
                            loading="lazy"
                          />
                        )}
                      </dl>
                    </article>
                    <article>
                      <span className="admin-eyebrow">CLAIMANT PROOF</span>
                      <h3>{selectedClaim.claim.name}</h3>
                      <dl>
                        <dt>Unique marks</dt>
                        <dd>{selectedClaim.claim.uniqueMarks || selectedClaim.claim.details}</dd>
                        <dt>Lost date</dt>
                        <dd>{selectedClaim.claim.lostDate || "Not provided"}</dd>
                        <dt>Lost location</dt>
                        <dd>{selectedClaim.claim.lostLocation || "Not provided"}</dd>
                        <dt>Submitted</dt>
                        <dd>
                          {selectedClaim.claim.createdAt
                            ? dateTime(selectedClaim.claim.createdAt)
                            : "—"}
                        </dd>
                      </dl>
                      {selectedClaim.claim.photoUrl && (
                        <img
                          src={selectedClaim.claim.photoUrl}
                          alt="Claimant's proof of ownership"
                          width={640}
                          height={480}
                          loading="lazy"
                        />
                      )}
                    </article>
                  </div>
                  <div className="admin-claim-decision">
                    <label htmlFor="claim-review-reason">
                      Decision reason <strong>Required</strong>
                    </label>
                    <textarea
                      id="claim-review-reason"
                      rows={3}
                      maxLength={500}
                      value={claimReason}
                      onChange={(event) => setClaimReason(event.target.value)}
                      placeholder="Explain the approval or rejection. This is included in the claimant's timeline."
                    />
                    <div>
                      <Button
                        disabled={!claimReason.trim() || claimMutation.isPending}
                        loading={claimMutation.isPending}
                        onClick={() =>
                          selectedClaim.claim.id &&
                          claimMutation.mutate({ id: selectedClaim.claim.id, status: "approved" })
                        }
                      >
                        Approve claim
                      </Button>
                      <Button
                        variant="danger"
                        disabled={!claimReason.trim() || claimMutation.isPending}
                        loading={claimMutation.isPending}
                        onClick={() =>
                          selectedClaim.claim.id &&
                          claimMutation.mutate({ id: selectedClaim.claim.id, status: "rejected" })
                        }
                      >
                        Reject claim
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {tab === "users" && (
          <section className="admin-section admin-management-grid">
            <section className="admin-panel">
              <header className="admin-panel-heading">
                <div>
                  <h2>Users</h2>
                  <span>{data.users.length} accounts</span>
                </div>
              </header>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <select
                            aria-label={`Role for ${user.name}`}
                            value={user.role}
                            onChange={(event) =>
                              userMutation.mutate({
                                id: user.id,
                                role: event.target.value as "member" | "admin",
                              })
                            }
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="admin-panel">
              <header className="admin-panel-heading">
                <div>
                  <h2>Categories</h2>
                  <span>Manage listing labels</span>
                </div>
                <Tags size={17} />
              </header>
              <form className="admin-category-form" onSubmit={submitCategory}>
                <input
                  aria-label="New category name"
                  maxLength={40}
                  placeholder="New category"
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                />
                <Button type="submit" size="sm" loading={categoryMutation.isPending}>
                  <Plus size={14} /> Add
                </Button>
              </form>
              <ul className="admin-category-list">
                {data.categories.map((category) => (
                  <li key={category}>
                    <span>{category}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${category}`}
                      onClick={() => deleteCategoryMutation.mutate(category)}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </section>
        )}

        {tab === "audit" && (
          <section className="admin-panel">
            <header className="admin-panel-heading">
              <div>
                <h2>Audit log</h2>
                <span>Most recent 200 administrative actions</span>
              </div>
            </header>
            <AuditTable entries={data.audit} />
          </section>
        )}
      </section>

      {helpOpen && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setHelpOpen(false);
          }}
        >
          <section
            className="admin-shortcuts"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-shortcuts-title"
          >
            <header>
              <h2 id="admin-shortcuts-title">Keyboard shortcuts</h2>
              <button type="button" aria-label="Close shortcuts" onClick={() => setHelpOpen(false)}>
                <X size={17} />
              </button>
            </header>
            <dl>
              <dt>
                <kbd>?</kbd>
              </dt>
              <dd>Open this shortcut guide</dd>
              <dt>
                <kbd>j</kbd> / <kbd>k</kbd>
              </dt>
              <dd>Move to next / previous report</dd>
              <dt>
                <kbd>a</kbd>
              </dt>
              <dd>Approve selected report(s)</dd>
              <dt>
                <kbd>r</kbd>
              </dt>
              <dd>Reject selected report(s)</dd>
              <dt>
                <kbd>d</kbd>
              </dt>
              <dd>Mark selected report(s) duplicate</dd>
              <dt>
                <kbd>Esc</kbd>
              </dt>
              <dd>Close the report drawer or this dialog</dd>
            </dl>
            <p>Shortcuts are active in the reports queue and paused while typing.</p>
          </section>
        </div>
      )}
    </div>
  );
}

function AuditTable({
  entries,
  compact = false,
}: {
  entries: Array<{
    id: string;
    actor: string;
    action: string;
    target: string;
    reason?: string;
    createdAt: string;
  }>;
  compact?: boolean;
}) {
  return (
    <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Target</th>
            {!compact && <th>Reason</th>}
            <th>Actor</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.action}</td>
              <td>{entry.target}</td>
              {!compact && <td>{entry.reason || "—"}</td>}
              <td>{entry.actor}</td>
              <td>{dateTime(entry.createdAt)}</td>
            </tr>
          ))}
          {!entries.length && (
            <tr>
              <td colSpan={compact ? 4 : 5} className="admin-empty-cell">
                No activity recorded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReportDrawer({
  report,
  onClose,
  onAction,
  pending,
}: {
  report: AdminReport;
  onClose: () => void;
  onAction: (status: ReportAction) => void;
  pending: boolean;
}) {
  return (
    <aside className="admin-report-drawer" aria-label="Report details">
      <header>
        <div>
          <span className="admin-eyebrow">REPORT DETAIL</span>
          <h2>{report.item.title}</h2>
        </div>
        <button aria-label="Close details" type="button" onClick={onClose}>
          <X size={17} />
        </button>
      </header>
      <dl>
        <dt>Report ID</dt>
        <dd>{report.id}</dd>
        <dt>Reason</dt>
        <dd>{report.reason}</dd>
        <dt>Details</dt>
        <dd>{report.details}</dd>
        <dt>Submitted</dt>
        <dd>{dateTime(report.createdAt)}</dd>
        <dt>Listing status</dt>
        <dd>
          {report.item.status} · {report.item.category}
        </dd>
        <dt>Location</dt>
        <dd>{report.item.location}</dd>
        <dt>Listing details</dt>
        <dd>{report.item.description}</dd>
      </dl>
      {report.item.image && (
        <img
          className="admin-drawer-image"
          src={report.item.image}
          alt={report.item.title}
          width={640}
          height={480}
          loading="lazy"
        />
      )}
      {report.reviewReason && (
        <p className="admin-reviewed-note">Review note: {report.reviewReason}</p>
      )}
      {report.status === "pending" && (
        <div className="admin-drawer-actions">
          <Button size="sm" disabled={pending} onClick={() => onAction("approved")}>
            Approve
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => onAction("rejected")}
          >
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => onAction("duplicate")}
          >
            Duplicate
          </Button>
        </div>
      )}
    </aside>
  );
}

export { AdminPage };
