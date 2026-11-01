import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Info,
  MapPin,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useBlocker, useParams } from "react-router-dom";
import { createItem } from "@/features/items/items.api";
import {
  formatReportDate,
  formatReportPhone,
  localDateString,
  reportSchema,
  type ReportValues,
  type ValidatedReportValues,
} from "@/features/items/report-schema";
import { getCategories } from "@/features/admin/admin.api";
import type { Category, NewItem } from "@/types";

const categories = [
  "Bags",
  "Clothing",
  "Documents",
  "Electronics",
  "Jewelry",
  "Keys",
  "Personal items",
  "Sports & outdoors",
  "Other",
] as const;
const steps = ["Item details", "Photos", "Location & date", "Contact", "Review"] as const;
const maxPhotos = 5;
const maxFileSize = 8 * 1024 * 1024;
const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const locations = [
  "Northside Library, reading room",
  "Pine Street Café",
  "Riverside Park, near the west steps",
  "Market Square, by the flower stalls",
  "Oak Street Pharmacy",
  "Harbor Coworking",
  "Willow Gardens, community hall",
  "Old Town post office",
  "Central Station, main hall",
  "Maple Avenue bus stop",
];
const categoryImages: Record<Category, string> = {
  Bags: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=960&q=85",
  Clothing:
    "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=960&q=85",
  Electronics:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=960&q=85",
  Jewelry:
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=960&q=85",
  Keys: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=960&q=85",
  "Personal items":
    "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=960&q=85",
  Other:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=960&q=85",
  Documents:
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=960&q=85",
  "Sports & outdoors":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=960&q=85",
};
type DraftPhoto = { name: string; dataUrl: string; size: number };
type ReportDraft = { values: Partial<ReportValues>; photos: DraftPhoto[]; step: number };

const stepFields: Array<Array<keyof ReportValues>> = [
  ["title", "category", "description"],
  [],
  ["location", "date", "time"],
  ["reporter", "contactEmail", "contactPhone"],
  [],
];

function isCategory(value: string): value is Category {
  return Boolean(value.trim());
}

function draftStorageKey(kind: string) {
  return `common-ground-report-draft-${kind}`;
}

function readDraft(kind: string): ReportDraft | null {
  try {
    const stored = window.localStorage.getItem(draftStorageKey(kind));
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<ReportDraft>;
    if (
      !candidate.values ||
      typeof candidate.values !== "object" ||
      !Array.isArray(candidate.photos) ||
      typeof candidate.step !== "number"
    ) {
      return null;
    }
    return {
      values: candidate.values,
      photos: candidate.photos
        .filter(
          (photo): photo is DraftPhoto =>
            Boolean(photo) &&
            typeof photo.name === "string" &&
            typeof photo.dataUrl === "string" &&
            typeof photo.size === "number",
        )
        .slice(0, maxPhotos),
      step: Math.max(0, Math.min(steps.length - 1, candidate.step)),
    };
  } catch (error) {
    console.warn("The saved listing draft could not be read.", error);
    return null;
  }
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("This image couldn’t be prepared. Try another photo."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`${file.name} couldn’t be opened as an image.`));
    };
    image.src = objectUrl;
  });
}

export function ReportPage() {
  const { kind } = useParams();
  const isValidKind = kind === "found" || kind === "lost";
  if (!isValidKind) return <Navigate to="/report/lost" replace />;
  return <ReportFlow key={kind} kind={kind} />;
}

function ReportFlow({ kind }: { kind: "lost" | "found" }) {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const categoryOptions = categoriesQuery.data ?? [...categories];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const processingFilesRef = useRef(false);
  const [draft] = useState(() => readDraft(kind));
  const [step, setStep] = useState(draft?.step ?? 0);
  const [photos, setPhotos] = useState<DraftPhoto[]>(draft?.photos ?? []);
  const [photoError, setPhotoError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [createdItem, setCreatedItem] = useState<Awaited<ReturnType<typeof createItem>> | null>(
    null,
  );
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const [draftSaveError, setDraftSaveError] = useState("");
  const status = kind;
  const isLost = status === "lost";
  const mutation = useMutation({
    mutationFn: (values: ValidatedReportValues) => {
      if (!isCategory(values.category)) {
        throw new Error("Choose a category before posting your listing.");
      }
      const imageList = photos.map((photo) => photo.dataUrl);
      const item: NewItem = {
        title: values.title,
        category: values.category,
        status,
        location: values.location,
        date: values.date,
        time: values.time || undefined,
        description: values.description,
        image: imageList[0] ?? categoryImages[values.category] ?? categoryImages.Other,
        images: imageList.length ? imageList : undefined,
        reporter: values.reporter,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone || undefined,
      };
      return createItem(item);
    },
    onSuccess: async (item) => {
      try {
        window.localStorage.removeItem(draftStorageKey(kind));
      } catch (error) {
        console.warn("The submitted listing draft could not be cleared.", error);
      }
      setCreatedItem(item);
      await queryClient.invalidateQueries({ queryKey: ["items"] });
      await queryClient.invalidateQueries({ queryKey: ["home-stats"] });
    },
  });
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    getValues,
    formState: { errors, isDirty },
  } = useForm<ReportValues, undefined, ValidatedReportValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      location: "",
      date: localDateString(),
      time: "",
      reporter: "",
      contactEmail: "",
      contactPhone: "",
      ...draft?.values,
    },
    shouldFocusError: true,
  });
  const values = watch();
  const valuesSnapshot = JSON.stringify(values);
  const restoredFormHasData =
    draft !== null &&
    Object.entries(draft.values).some(
      ([key, value]) => key !== "date" && typeof value === "string" && value.trim().length > 0,
    );
  const hasDraftChanges = isDirty || photos.length > 0 || step > 0 || restoredFormHasData;
  const blocker = useBlocker(hasDraftChanges && !createdItem && !mutation.isPending);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    const shouldLeave = window.confirm(
      "Leave this listing? Your draft is saved on this device and will be here when you return.",
    );
    if (shouldLeave) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  useEffect(() => {
    if (createdItem || (!isDirty && photos.length === 0 && step === 0)) return;
    const timeout = window.setTimeout(() => {
      try {
        const saved: ReportDraft = { values: getValues(), photos, step };
        window.localStorage.setItem(draftStorageKey(kind), JSON.stringify(saved));
        setDraftSaveError("");
        setDraftSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      } catch (error) {
        console.warn("Your listing draft could not be saved.", error);
        setDraftSaveError(
          "This device couldn’t save your draft. Keep this page open until you post.",
        );
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [createdItem, getValues, isDirty, kind, photos, step, valuesSnapshot]);

  useEffect(() => {
    if (createdItem) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasDraftChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [createdItem, hasDraftChanges]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [createdItem, step]);

  const stepFieldsCurrent = stepFields[step] as Array<keyof ReportValues>;

  async function goNext() {
    if (stepFieldsCurrent.length && !(await trigger(stepFieldsCurrent, { shouldFocus: true })))
      return;
    setStep((current) => Math.min(steps.length - 1, current + 1));
  }

  function goBack() {
    setStep((current) => Math.max(0, current - 1));
  }

  async function addFiles(fileList: FileList | File[]) {
    if (processingFilesRef.current) {
      setPhotoError("Please wait for these photos to finish preparing before adding more.");
      return;
    }
    if (photos.length >= maxPhotos) {
      setPhotoError(`You can add up to ${maxPhotos} photos. Remove a photo before adding another.`);
      return;
    }
    const incoming = Array.from(fileList);
    const availableSlots = maxPhotos - photos.length;
    if (incoming.length > availableSlots) {
      setPhotoError(`You can add up to ${maxPhotos} photos. Remove a photo before adding another.`);
    } else {
      setPhotoError("");
    }
    const selection = incoming.slice(0, availableSlots);
    if (!selection.length) return;
    processingFilesRef.current = true;
    try {
      for (let index = 0; index < selection.length; index += 1) {
        const file = selection[index];
        if (!acceptedTypes.includes(file.type)) {
          setPhotoError(`${file.name} isn’t a supported image. Choose a JPG, PNG, or WebP.`);
          continue;
        }
        if (file.size > maxFileSize) {
          setPhotoError(`${file.name} is larger than 8 MB. Choose a smaller image.`);
          continue;
        }
        setUploadProgress(0);
        try {
          const dataUrl = await compressImage(file);
          setPhotos((current) => [...current, { name: file.name, dataUrl, size: file.size }]);
          setUploadProgress(Math.round(((index + 1) / selection.length) * 100));
        } catch (error) {
          setPhotoError(error instanceof Error ? error.message : "The image couldn’t be prepared.");
        }
      }
    } finally {
      processingFilesRef.current = false;
      window.setTimeout(() => setUploadProgress(null), 600);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files) void addFiles(event.currentTarget.files);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void addFiles(event.dataTransfer.files);
  }

  async function submit(valuesToSubmit: ValidatedReportValues) {
    await mutation.mutateAsync(valuesToSubmit);
  }

  const categoryLabel = (category: string) => category || "Choose a category in Item details";

  if (createdItem) {
    return (
      <section className="report-success page-wrap" aria-labelledby="report-success-heading">
        <div className="report-success-mark">
          <CheckCircle2 size={26} aria-hidden="true" />
        </div>
        <p className="eyebrow">{isLost ? "Lost item posted" : "Found item posted"}</p>
        <h1 id="report-success-heading" tabIndex={-1} ref={headingRef}>
          Your listing is on the board.
        </h1>
        <p className="report-success-intro">
          Thanks for helping a neighbor. We’ll keep your contact details private.
        </p>
        <div className="report-success-reference">
          <span>Reference number</span>
          <strong>{createdItem.id}</strong>
        </div>
        <div className="report-next-steps">
          <h2>What happens next</h2>
          <ol>
            <li>Neighbors can now find your listing in search.</li>
            <li>If someone recognizes it, they can send you a private note.</li>
            <li>Choose a public place if you arrange a handoff.</li>
          </ol>
        </div>
        <div className="report-success-actions">
          <Link className="button button-dark" to={`/items/${createdItem.id}`}>
            View your listing <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link className="button button-outline" to="/items">
            Browse listings
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="form-page page-wrap report-flow-page">
      <Link className="back-link" to="/">
        <ArrowLeft size={15} aria-hidden="true" /> Back to the noticeboard
      </Link>
      <div className="form-layout">
        <aside className="form-intro">
          <p className="eyebrow">
            <span className={`eyebrow-dot ${!isLost ? "dot-found" : ""}`} />
            {isLost ? "Lost something?" : "Found something?"}
          </p>
          <h1>{isLost ? "Tell us what you’re missing." : "Tell us what you found."}</h1>
          <p>
            {isLost
              ? "A few thoughtful details can help your neighbors recognize it. Keep unique clues private."
              : "A clear description helps the owner feel sure it’s theirs. Leave private details out."}
          </p>
          <div className="privacy-note">
            <Info size={17} aria-hidden="true" />
            <span>
              <strong>Shown publicly:</strong> item details, general location, date, and your first
              name. <strong>Kept private:</strong> your email and optional phone number.
            </span>
          </div>
          <div className="form-progress" aria-live="polite">
            <span className="progress-check">
              <Check size={13} aria-hidden="true" />
            </span>
            <span>
              {draftSaveError ||
                (draftSavedAt
                  ? `Draft saved at ${draftSavedAt}`
                  : draft
                    ? "A saved draft was restored."
                    : "Your draft saves on this device.")}
            </span>
          </div>
        </aside>

        <div className="report-form">
          <div className="form-topline">
            <span>YOUR LISTING</span>
            <span>
              <b>*</b> Required
            </span>
          </div>
          <ol className="report-stepper" aria-label="Listing steps">
            {steps.map((label, index) => (
              <li
                className={index === step ? "is-current" : index < step ? "is-complete" : ""}
                aria-current={index === step ? "step" : undefined}
                key={label}
              >
                <span>{index < step ? <Check size={13} aria-hidden="true" /> : index + 1}</span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
          <p className="sr-only" role="status" aria-live="polite">
            Step {step + 1} of {steps.length}: {steps[step]}
          </p>

          <form onSubmit={handleSubmit(submit)} noValidate>
            <div className="report-step-content">
              <h2 tabIndex={-1} ref={headingRef}>
                {steps[step]}
              </h2>
              {step === 0 && (
                <>
                  <div className="form-field">
                    <label htmlFor="title">
                      What is it? <b>*</b>
                    </label>
                    <input
                      id="title"
                      maxLength={80}
                      placeholder="e.g. Blue umbrella with a wooden handle"
                      aria-invalid={Boolean(errors.title)}
                      aria-describedby={errors.title ? "title-error" : undefined}
                      {...register("title")}
                    />
                    {errors.title && (
                      <p className="field-error" id="title-error" role="alert">
                        {errors.title.message}
                      </p>
                    )}
                  </div>
                  <div className="form-field">
                    <label htmlFor="category">
                      Category <b>*</b>
                    </label>
                    <select
                      id="category"
                      aria-invalid={Boolean(errors.category)}
                      aria-describedby={errors.category ? "category-error" : undefined}
                      {...register("category")}
                    >
                      <option value="">Choose one</option>
                      {categoryOptions.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="field-error" id="category-error" role="alert">
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                  <div className="form-field">
                    <label htmlFor="description">
                      A few more details <b>*</b>
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      maxLength={600}
                      placeholder="Color, material, a detail only the owner would know…"
                      aria-invalid={Boolean(errors.description)}
                      aria-describedby={
                        errors.description ? "description-error" : "description-help"
                      }
                      {...register("description")}
                    />
                    <span className="form-field-hint" id="description-help">
                      Leave serial numbers and other one-of-a-kind clues out of the public listing.
                    </span>
                    {errors.description && (
                      <p className="field-error" id="description-error" role="alert">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <p className="report-step-intro">
                    Photos can help someone recognize an item. Avoid showing names, addresses, or
                    other private details.
                  </p>
                  <label className="sr-only" htmlFor="report-photos">
                    Upload item photos
                  </label>
                  <input
                    ref={fileInputRef}
                    className="sr-only"
                    id="report-photos"
                    type="file"
                    accept={acceptedTypes.join(",")}
                    multiple
                    onChange={onFileChange}
                  />
                  <div
                    className={`report-upload-zone${dragging ? " is-dragging" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-label="Add photos. JPG, PNG, or WebP, up to 8 megabytes each, five photos maximum."
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                  >
                    <span className="report-upload-icon">
                      <ImagePlus size={22} aria-hidden="true" />
                    </span>
                    <strong>Drop photos here, or choose files</strong>
                    <span>
                      JPG, PNG, or WebP · up to 8 MB each · {photos.length}/{maxPhotos} photos
                    </span>
                    <span className="button button-outline">
                      <Upload size={15} aria-hidden="true" /> Choose photos
                    </span>
                  </div>
                  {uploadProgress !== null && (
                    <div className="report-upload-progress" role="status" aria-live="polite">
                      <span>Preparing photos… {uploadProgress}%</span>
                      <progress value={uploadProgress} max="100">
                        {uploadProgress}%
                      </progress>
                    </div>
                  )}
                  {photoError && (
                    <p className="field-error" role="alert">
                      {photoError}
                    </p>
                  )}
                  {photos.length > 0 && (
                    <ul className="report-photo-list" aria-label="Selected photos">
                      {photos.map((photo, index) => (
                        <li key={`${photo.name}-${index}`}>
                          <img
                            src={photo.dataUrl}
                            alt={`Preview: ${photo.name}`}
                            width={640}
                            height={480}
                          />
                          <span title={photo.name}>{photo.name}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${photo.name}`}
                            onClick={() =>
                              setPhotos((current) =>
                                current.filter((_, photoIndex) => photoIndex !== index),
                              )
                            }
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="form-field-hint">
                    Photos are resized on this device before they are added to the listing.
                  </p>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="form-field">
                    <label htmlFor="location">
                      Where was it? <b>*</b>
                    </label>
                    <input
                      id="location"
                      list="report-location-suggestions"
                      maxLength={100}
                      placeholder="A nearby place, street, or landmark"
                      aria-invalid={Boolean(errors.location)}
                      aria-describedby={errors.location ? "location-error" : "location-help"}
                      {...register("location")}
                    />
                    <datalist id="report-location-suggestions">
                      {locations.map((place) => (
                        <option value={place} key={place} />
                      ))}
                    </datalist>
                    <span className="form-field-hint" id="location-help">
                      A general location is safer than an exact address.
                    </span>
                    {errors.location && (
                      <p className="field-error" id="location-error" role="alert">
                        {errors.location.message}
                      </p>
                    )}
                  </div>
                  <div className="report-map-placeholder" role="group" aria-label="Map preview">
                    <MapPin size={20} aria-hidden="true" />
                    <div>
                      <strong>Location preview</strong>
                      <span>{values.location || "Your general location will appear here."}</span>
                    </div>
                    <span className="report-map-label">Map preview</span>
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label htmlFor="date">
                        {isLost ? "When did you last see it?" : "When did you find it?"} <b>*</b>
                      </label>
                      <input
                        id="date"
                        type="date"
                        max={localDateString()}
                        aria-invalid={Boolean(errors.date)}
                        aria-describedby={errors.date ? "date-error" : undefined}
                        {...register("date")}
                      />
                      {errors.date && (
                        <p className="field-error" id="date-error" role="alert">
                          {errors.date.message}
                        </p>
                      )}
                    </div>
                    <div className="form-field">
                      <label htmlFor="time">
                        Approximate time <span>(optional)</span>
                      </label>
                      <input id="time" type="time" {...register("time")} />
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="report-step-intro">
                    Neighbors see your first name. Your email and phone number are only for private
                    follow-up.
                  </p>
                  <div className="form-field">
                    <label htmlFor="reporter">
                      Your first name <b>*</b>
                    </label>
                    <input
                      id="reporter"
                      autoComplete="given-name"
                      maxLength={40}
                      placeholder="How neighbors will see you"
                      aria-invalid={Boolean(errors.reporter)}
                      aria-describedby={errors.reporter ? "reporter-error" : undefined}
                      {...register("reporter")}
                    />
                    {errors.reporter && (
                      <p className="field-error" id="reporter-error" role="alert">
                        {errors.reporter.message}
                      </p>
                    )}
                  </div>
                  <div className="form-field">
                    <label htmlFor="contactEmail">
                      Email address <b>*</b>
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      aria-invalid={Boolean(errors.contactEmail)}
                      aria-describedby={errors.contactEmail ? "contactEmail-error" : undefined}
                      {...register("contactEmail")}
                    />
                    {errors.contactEmail && (
                      <p className="field-error" id="contactEmail-error" role="alert">
                        {errors.contactEmail.message}
                      </p>
                    )}
                  </div>
                  <div className="form-field">
                    <label htmlFor="contactPhone">
                      Phone number <span>(optional)</span>
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      autoComplete="tel"
                      maxLength={24}
                      placeholder="Only shared if you choose"
                      aria-invalid={Boolean(errors.contactPhone)}
                      aria-describedby={errors.contactPhone ? "contactPhone-error" : undefined}
                      {...register("contactPhone")}
                    />
                    {errors.contactPhone && (
                      <p className="field-error" id="contactPhone-error" role="alert">
                        {errors.contactPhone.message}
                      </p>
                    )}
                  </div>
                  <div className="report-contact-privacy">
                    <ShieldCheck size={17} aria-hidden="true" />
                    <span>
                      Your email and phone number are never displayed on the public listing.
                    </span>
                  </div>
                </>
              )}

              {step === 4 && (
                <div className="report-review">
                  <p className="report-step-intro">
                    Take a moment to check the details before this goes on the board.
                  </p>
                  <section>
                    <div className="report-review-heading">
                      <h3>Item details</h3>
                      <button type="button" onClick={() => setStep(0)}>
                        Edit
                      </button>
                    </div>
                    <dl>
                      <div>
                        <dt>Item</dt>
                        <dd className="report-review-item-title">{values.title}</dd>
                      </div>
                      <div>
                        <dt>Category</dt>
                        <dd>{categoryLabel(values.category)}</dd>
                      </div>
                      <div>
                        <dt>Description</dt>
                        <dd>{values.description}</dd>
                      </div>
                    </dl>
                  </section>
                  <section>
                    <div className="report-review-heading">
                      <h3>Photos</h3>
                      <button type="button" onClick={() => setStep(1)}>
                        Edit
                      </button>
                    </div>
                    {photos.length ? (
                      <div className="report-review-photos">
                        {photos.map((photo, index) => (
                          <img
                            src={photo.dataUrl}
                            alt={`Photo ${index + 1}`}
                            width={640}
                            height={480}
                            key={`${photo.name}-${index}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <p>No photos added.</p>
                    )}
                  </section>
                  <section>
                    <div className="report-review-heading">
                      <h3>Location and date</h3>
                      <button type="button" onClick={() => setStep(2)}>
                        Edit
                      </button>
                    </div>
                    <dl>
                      <div>
                        <dt>Place</dt>
                        <dd>{values.location}</dd>
                      </div>
                      <div>
                        <dt>Date</dt>
                        <dd>
                          {formatReportDate(values.date)}
                          {values.time ? ` · ${values.time}` : ""}
                        </dd>
                      </div>
                    </dl>
                  </section>
                  <section>
                    <div className="report-review-heading">
                      <h3>Contact</h3>
                      <button type="button" onClick={() => setStep(3)}>
                        Edit
                      </button>
                    </div>
                    <dl>
                      <div>
                        <dt>Name</dt>
                        <dd>{values.reporter}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{values.contactEmail}</dd>
                      </div>
                      {values.contactPhone && (
                        <div>
                          <dt>Phone</dt>
                          <dd>{formatReportPhone(values.contactPhone)}</dd>
                        </div>
                      )}
                    </dl>
                  </section>
                </div>
              )}
            </div>

            {mutation.isError && (
              <p className="form-error" role="alert">
                {mutation.error.message}
              </p>
            )}
            <div className="report-step-actions">
              {step > 0 ? (
                <button className="button button-outline" type="button" onClick={goBack}>
                  <ChevronLeft size={16} aria-hidden="true" /> Back
                </button>
              ) : (
                <span />
              )}
              {step < steps.length - 1 ? (
                <button
                  className="button button-dark"
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    void goNext();
                  }}
                >
                  Continue <ChevronRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button className="button button-dark" type="submit" disabled={mutation.isPending}>
                  {mutation.isPending
                    ? "Posting your listing…"
                    : isLost
                      ? "Post lost item"
                      : "Post found item"}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
            <p className="form-terms">
              By posting, you agree to keep this a kind and helpful space for everyone.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
