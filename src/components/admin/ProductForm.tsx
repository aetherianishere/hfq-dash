"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Save, Trash2 } from "lucide-react";

export type ProductFormInitial = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  price: string;
  currency: string;
  description: string;
  perks: string;
  color: string;
  dark: string;
  imageUrl: string | null;
  badge: string;
  popular: boolean;
  active: boolean;
  sortOrder: number;
  deliveryType: string;
  deliveryCommand: string;
};

const EMPTY: ProductFormInitial = {
  name: "",
  slug: "",
  category: "RANK",
  price: "",
  currency: "LKR",
  description: "",
  perks: "",
  color: "#ff3047",
  dark: "#7a0f1f",
  imageUrl: null,
  badge: "",
  popular: false,
  active: true,
  sortOrder: 0,
  deliveryType: "MANUAL",
  deliveryCommand: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function ProductForm({
  mode,
  initial,
  demo,
}: {
  mode: "create" | "edit";
  initial?: ProductFormInitial;
  demo: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormInitial>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState(initial?.imageUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function set<K extends keyof ProductFormInitial>(
    key: K,
    value: ProductFormInitial[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setName(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        mode === "create" && !slugTouched
          ? slugify(value)
          : current.slug,
    }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (demo) {
      setError("Demo mode cannot save products. Connect MySQL and disable DEMO_MODE.");
      return;
    }

    if (!form.name.trim() || !form.price.trim()) {
      setError("Name and price are required.");
      return;
    }

    setBusy(true);
    try {
      const data = new FormData();
      data.set("name", form.name);
      data.set("slug", form.slug);
      data.set("category", form.category);
      data.set("price", form.price);
      data.set("currency", form.currency);
      data.set("description", form.description);
      data.set("perks", form.perks);
      data.set("color", form.color);
      data.set("dark", form.dark);
      data.set("badge", form.badge);
      data.set("popular", form.popular ? "true" : "false");
      data.set("active", form.active ? "true" : "false");
      data.set("sortOrder", String(form.sortOrder));
      data.set("deliveryType", form.deliveryType);
      data.set("deliveryCommand", form.deliveryCommand);
      if (image) data.set("image", image);

      const response = await fetch(
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${form.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          body: data,
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Could not save the product.");
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      {error && <div className="auth-error">{error}</div>}
      {demo && (
        <div className="auth-error">
          Demo preview. Saving is disabled until MySQL is connected.
        </div>
      )}

      <div className="pay-card">
        <p className="panel-title">Basics</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="auth-field sm:col-span-2">
            <span className="auth-label">Product name</span>
            <input
              className="auth-input"
              value={form.name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              placeholder="Elite Rank"
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Slug</span>
            <input
              className="auth-input"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                set("slug", event.target.value);
              }}
              maxLength={80}
              placeholder="elite-rank"
            />
            <span className="text-[10px] text-hfq-dim">
              Used in /store/your-slug. Changing it changes the public link.
            </span>
          </label>

          <label className="auth-field">
            <span className="auth-label">Category</span>
            <select
              className="auth-input"
              value={form.category}
              onChange={(event) => set("category", event.target.value)}
            >
              <option value="RANK">Ranks</option>
              <option value="UPGRADE">Upgrades</option>
              <option value="KEY">Keys</option>
              <option value="SHARDS">Shards</option>
              <option value="OTHER">Other</option>
            </select>
          </label>

          <label className="auth-field">
            <span className="auth-label">Price</span>
            <div className="flex">
              <select
                className="auth-input !w-24 !rounded-none"
                value={form.currency}
                onChange={(event) => set("currency", event.target.value)}
              >
                <option value="LKR">LKR</option>
                <option value="USD">USD</option>
              </select>
              <input
                className="auth-input"
                value={form.price}
                onChange={(event) => set("price", event.target.value)}
                inputMode="decimal"
                placeholder="2500.00"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-label">Sort order</span>
            <input
              className="auth-input"
              type="number"
              min={0}
              max={10000}
              value={form.sortOrder}
              onChange={(event) => set("sortOrder", Number(event.target.value))}
            />
          </label>

          <label className="auth-field sm:col-span-2">
            <span className="auth-label">Description</span>
            <textarea
              className="auth-input min-h-24"
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              maxLength={2000}
              placeholder="Short description shown on the store."
            />
          </label>

          <label className="auth-field sm:col-span-2">
            <span className="auth-label">Perks (one per line)</span>
            <textarea
              className="auth-input min-h-32"
              value={form.perks}
              onChange={(event) => set("perks", event.target.value)}
              maxLength={5000}
              placeholder={"[ELITE] prefix\n8 home slots\nElite-only kit"}
            />
          </label>
        </div>
      </div>

      <div className="pay-card">
        <p className="panel-title">Appearance</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="auth-field">
            <span className="auth-label">Accent colour</span>
            <div className="flex gap-2">
              <input
                type="color"
                className="h-12 w-14 border-[3px] border-ink bg-bg"
                value={form.color}
                onChange={(event) => set("color", event.target.value)}
              />
              <input
                className="auth-input"
                value={form.color}
                onChange={(event) => set("color", event.target.value)}
                maxLength={7}
              />
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-label">Dark colour</span>
            <div className="flex gap-2">
              <input
                type="color"
                className="h-12 w-14 border-[3px] border-ink bg-bg"
                value={form.dark}
                onChange={(event) => set("dark", event.target.value)}
              />
              <input
                className="auth-input"
                value={form.dark}
                onChange={(event) => set("dark", event.target.value)}
                maxLength={7}
              />
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-label">Badge (optional)</span>
            <input
              className="auth-input"
              value={form.badge}
              onChange={(event) => set("badge", event.target.value)}
              maxLength={40}
              placeholder="Best Value"
            />
          </label>

          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.popular}
                onChange={(event) => set("popular", event.target.checked)}
              />
              Most popular
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => set("active", event.target.checked)}
              />
              Visible in the store
            </label>
          </div>

          <div className="sm:col-span-2">
            <p className="auth-label mb-2">Product image</p>
            <div className="flex flex-wrap items-start gap-4">
              <div className="grid h-32 w-32 place-items-center border-[3px] border-ink bg-[rgba(11,4,6,0.55)]">
                {preview ? (
                  <img
                    src={preview}
                    alt=""
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <ImagePlus size={26} className="text-hfq-dim" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="mc-btn mc-btn-sm cursor-pointer">
                  <ImagePlus size={15} />
                  Choose image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setImage(file);
                      setPreview(
                        file ? URL.createObjectURL(file) : (form.imageUrl ?? ""),
                      );
                    }}
                  />
                </label>
                <p className="text-[10px] text-hfq-dim">
                  PNG, JPG, or WEBP · 5MB max. Uploaded images are served from
                  your VPS, not the public folder.
                </p>
                {image && (
                  <button
                    type="button"
                    className="btn-ghost justify-center"
                    onClick={() => {
                      setImage(null);
                      setPreview(form.imageUrl ?? "");
                    }}
                  >
                    <Trash2 size={14} />
                    Remove new image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pay-card">
        <p className="panel-title">Delivery</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="auth-field">
            <span className="auth-label">Delivery type</span>
            <select
              className="auth-input"
              value={form.deliveryType}
              onChange={(event) => set("deliveryType", event.target.value)}
            >
              <option value="MANUAL">Manual</option>
              <option value="COMMAND">Command</option>
            </select>
          </label>

          <div className="flex items-end text-xs text-hfq-dim">
            Use <code className="mx-1 font-mono">{"{username}"}</code> where the
            player name should go.
          </div>

          <label className="auth-field sm:col-span-2">
            <span className="auth-label">Delivery command</span>
            <textarea
              className="auth-input min-h-20 font-mono"
              value={form.deliveryCommand}
              onChange={(event) => set("deliveryCommand", event.target.value)}
              maxLength={2000}
              placeholder="lp user {username} parent add elite"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="mc-btn" disabled={busy || demo}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {mode === "create" ? "Create product" : "Save changes"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => router.push("/admin/products")}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
