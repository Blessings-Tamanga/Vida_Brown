import { useState, useEffect, type FormEventHandler } from "react";
import Head from "next/head";

// ---------- Types ----------
type VideoItem = {
  id: number;
  title: string;
  youtube_id: string;
  embed_url: string;
  category: string;
  views: number;
  likes: number;
  duration: string;
  upload_date: string;
  description: string;
  is_featured: number;
  is_active: number;
};

type TrackItem = {
  id: number;
  title: string;
  artist_name: string;
  featured_artist?: string | null;
  year?: string | null;
  streams: number;
  track_number: number;
  track_type: string;
  artist_id: number;
  is_active: number;
};

type GalleryItem = {
  id: number;
  url: string;
  alt_text: string;
  order: number;
  is_active: number;
};

type SiteContent = {
  slug: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  cta_primary_label: string | null;
  cta_primary_url: string | null;
  cta_secondary_label: string | null;
  cta_secondary_url: string | null;
};

type ArtistProfile = {
  id: number;
  name: string;
  title: string;
  bio: string;
  followers: number;
  hero_image_url?: string | null;
  spotify_url?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
};

function formatCount(value: number) {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return value.toString();
}

// ---------- Reusable API helpers ----------
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return { detail: "Invalid response from server" };
  }
}

async function revalidateHome() {
  const token = localStorage.getItem("admin_token");
  try {
    await fetch(`/api/revalidate?secret=${token}`);
  } catch (e) {
    console.warn("Revalidation failed", e);
  }
}

async function uploadFile(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token || "",
    },
    body: JSON.stringify({ dataUrl, filename: file.name }),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || "Upload failed");
  return result.url;
}

// ---------- Main Admin Component ----------
export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [siteContent, setSiteContent] = useState<Record<string, SiteContent>>({});
  const [activeTab, setActiveTab] = useState<"videos" | "tracks" | "gallery" | "artist" | "hero" | "about">("videos");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (token) {
      fetch("/api/admin/me", { headers: { "x-admin-token": token } })
        .then((r) => r.json())
        .then((data) => {
          if (data.authenticated) setLoggedIn(true);
          else localStorage.removeItem("admin_token");
        });
    }
  }, []);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    const headers = { "x-admin-token": token };
    try {
      const [vRes, tRes, gRes, aRes, cRes] = await Promise.all([
        fetch("/api/admin/videos", { headers }),
        fetch("/api/admin/tracks", { headers }),
        fetch("/api/admin/gallery", { headers }),
        fetch("/api/admin/artist", { headers }),
        fetch("/api/admin/content", { headers }),
      ]);
      if (vRes.ok) setVideos(await vRes.json());
      if (tRes.ok) setTracks(await tRes.json());
      if (gRes.ok) setGallery(await gRes.json());
      if (aRes.ok) setArtist(await aRes.json());
      if (cRes.ok) {
        const rows: SiteContent[] = await cRes.json();
        setSiteContent(Object.fromEntries(rows.map((item) => [item.slug, item])));
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (loggedIn) fetchData();
  }, [loggedIn]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Login handler
  const handleLogin: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("admin_token", data.token);
      setLoggedIn(true);
    } else {
      const data = await safeJson(res);
      setError(data.detail || "Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setLoggedIn(false);
  };

  // Generic action runner (calls API, revalidates, refreshes)
  const runAction = async (action: () => Promise<void>) => {
    try {
      await action();
      await revalidateHome();
      await fetchData();
      addToast("Saved successfully", "success");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Action failed", "error");
    }
  };

  // Login screen
  if (!loggedIn) {
    return (
      <>
        <Head>
          <title>Admin Login | Vida Brown</title>
        </Head>
        <div className="login-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-base)" }}>
          <div className="glass-card" style={{ padding: 48, maxWidth: 400, width: "100%" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--primary)", marginBottom: 16 }}>admin_panel_settings</span>
            <h2 style={{ marginBottom: 24 }}>Admin Access</h2>
            <form onSubmit={handleLogin}>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required
                style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "inherit", marginBottom: 16 }} />
              <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>Login</button>
            </form>
            {error && <p style={{ color: "#f87171", marginTop: 8, textAlign: "center" }}>{error}</p>}
          </div>
        </div>
      </>
    );
  }

  // ---------- Dashboard UI ----------
  return (
    <>
      <Head>
        <title>Admin | Vida Brown</title>
      </Head>
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>×</button>
          </div>
        ))}
      </div>
      <div className="admin-layout" style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
        <aside className="admin-sidebar">
          <div className="logo" style={{ padding: "0 12px 24px", borderBottom: "1px solid var(--glass-border)", marginBottom: 16 }}>
            <span className="material-symbols-outlined">equalizer</span> VIDA BROWN
          </div>
          <button onClick={() => setActiveTab("videos")} className={`admin-nav-link ${activeTab === "videos" ? "active" : ""}`}><span className="material-symbols-outlined">video_library</span> Videos</button>
          <button onClick={() => setActiveTab("tracks")} className={`admin-nav-link ${activeTab === "tracks" ? "active" : ""}`}><span className="material-symbols-outlined">music_note</span> Tracks</button>
          <button onClick={() => setActiveTab("gallery")} className={`admin-nav-link ${activeTab === "gallery" ? "active" : ""}`}><span className="material-symbols-outlined">photo_library</span> Gallery</button>
          <button onClick={() => setActiveTab("artist")} className={`admin-nav-link ${activeTab === "artist" ? "active" : ""}`}><span className="material-symbols-outlined">person</span> Artist</button>
          <button onClick={() => setActiveTab("hero")} className={`admin-nav-link ${activeTab === "hero" ? "active" : ""}`}><span className="material-symbols-outlined">edit_note</span> Hero</button>
          <button onClick={() => setActiveTab("about")} className={`admin-nav-link ${activeTab === "about" ? "active" : ""}`}><span className="material-symbols-outlined">info</span> About</button>
          <div style={{ flex: 1 }} />
          <button onClick={handleLogout} className="admin-nav-link" style={{ color: "#f87171" }}><span className="material-symbols-outlined">logout</span> Logout</button>
        </aside>

        <main className="admin-main" style={{ padding: 32 }}>
          {loading && <p>Loading…</p>}
          {activeTab === "videos" && <VideoManager videos={videos} runAction={runAction} />}
          {activeTab === "tracks" && <TrackManager tracks={tracks} runAction={runAction} />}
          {activeTab === "gallery" && <GalleryManager gallery={gallery} runAction={runAction} addToast={addToast} />}
          {activeTab === "artist" && <ArtistEditor artist={artist} runAction={runAction} addToast={addToast} />}
          {activeTab === "hero" && <SiteContentEditor slug="hero" content={siteContent["hero"] || { slug: "hero", title: "", subtitle: "", body: "", image_url: "", cta_primary_label: "", cta_primary_url: "", cta_secondary_label: "", cta_secondary_url: "" }} runAction={runAction} addToast={addToast} />}
          {activeTab === "about" && <SiteContentEditor slug="about" content={siteContent["about"] || { slug: "about", title: "", body: "" }} runAction={runAction} addToast={addToast} />}
        </main>
      </div>
    </>
  );
}

// ---------- Video Manager ----------
function VideoManager({ videos, runAction }: { videos: VideoItem[]; runAction: (fn: () => Promise<void>) => void }) {
  const [editing, setEditing] = useState<VideoItem | null>(null);
  const [form, setForm] = useState<Partial<VideoItem>>({
    title: "", youtube_id: "", embed_url: "", category: "", views: 0, likes: 0, duration: "", upload_date: "", description: "", is_featured: 0
  });

  const resetForm = () => setForm({ title: "", youtube_id: "", embed_url: "", category: "", views: 0, likes: 0, duration: "", upload_date: "", description: "", is_featured: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await runAction(async () => {
        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Not authenticated");
        const res = await fetch(`/api/admin/videos/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-admin-token": token },
          body: JSON.stringify({ ...form, is_active: editing.is_active }),
        });
        if (!res.ok) throw new Error((await safeJson(res)).detail || "Update failed");
      });
      setEditing(null);
    } else {
      await runAction(async () => {
        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Not authenticated");
        const res = await fetch("/api/admin/videos", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-token": token },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await safeJson(res)).detail || "Create failed");
      });
    }
    resetForm();
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editing) setForm(editing);
    else resetForm();
  }, [editing]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleActive = (video: VideoItem) => {
    runAction(async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`/api/admin/videos/${video.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ ...video, is_active: video.is_active ? 0 : 1 }),
      });
      if (!res.ok) throw new Error((await safeJson(res)).detail || "Toggle failed");
    });
  };

  const deletePermanently = (id: number) => {
    if (!confirm("Delete permanently?")) return;
    runAction(async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
        body: JSON.stringify({ permanent: true }),
      });
      if (!res.ok) throw new Error((await safeJson(res)).detail || "Delete failed");
    });
  };

  return (
    <div>
      <h2>Videos</h2>
      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
        <h3>{editing ? "Edit Video" : "Add Video"}</h3>
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <input className="admin-input" placeholder="Title" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <input className="admin-input" placeholder="YouTube ID" value={form.youtube_id || ""} onChange={e => setForm({ ...form, youtube_id: e.target.value })} required />
            <input className="admin-input" placeholder="Embed URL" value={form.embed_url || ""} onChange={e => setForm({ ...form, embed_url: e.target.value })} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <input className="admin-input" placeholder="Category" value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} required />
            <input className="admin-input" type="number" placeholder="Views" value={form.views} onChange={e => setForm({ ...form, views: +e.target.value })} />
            <input className="admin-input" type="number" placeholder="Likes" value={form.likes} onChange={e => setForm({ ...form, likes: +e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <input className="admin-input" placeholder="Duration" value={form.duration || ""} onChange={e => setForm({ ...form, duration: e.target.value })} />
            <input className="admin-input" placeholder="Upload date" value={form.upload_date || ""} onChange={e => setForm({ ...form, upload_date: e.target.value })} />
          </div>
          <textarea className="admin-input" placeholder="Description" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} />
          <label><input type="checkbox" checked={!!form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked ? 1 : 0 })} /> Feature on homepage</label>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary">{editing ? "Update" : "Save"}</button>
            {editing && <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>}
          </div>
        </div>
      </form>

      <div className="list-container">
        {videos.map(v => (
          <div key={v.id} className="list-item" style={{ opacity: v.is_active ? 1 : 0.5 }}>
            <div className="list-item-info">
              <strong>{v.title}</strong>
              <span style={{ color: "var(--text-secondary)", marginLeft: 12 }}>{v.category} · {formatCount(v.views)} views {!v.is_active && <span className="badge badge-outline">Inactive</span>}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditing(v)} className="btn btn-outline btn-sm">Edit</button>
              <button onClick={() => toggleActive(v)} className="btn btn-outline btn-sm">{v.is_active ? "Deactivate" : "Activate"}</button>
              <button onClick={() => deletePermanently(v.id)} className="btn btn-outline btn-sm" style={{ color: "#f87171" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Track Manager ----------
function TrackManager({ tracks, runAction }: { tracks: TrackItem[]; runAction: (fn: () => Promise<void>) => void }) {
  const [editing, setEditing] = useState<TrackItem | null>(null);
  const [form, setForm] = useState<Partial<TrackItem>>({
    track_number: 1, title: "", artist_name: "Vida Brown", featured_artist: "", year: "", streams: 0, track_type: "Single", artist_id: 1
  });

  const resetForm = () => setForm({ track_number: 1, title: "", artist_name: "Vida Brown", featured_artist: "", year: "", streams: 0, track_type: "Single", artist_id: 1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await runAction(async () => {
        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Not authenticated");
        const res = await fetch(`/api/admin/tracks/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-admin-token": token },
          body: JSON.stringify({ ...form, is_active: editing.is_active }),
        });
        if (!res.ok) throw new Error((await safeJson(res)).detail || "Update failed");
      });
      setEditing(null);
    } else {
      await runAction(async () => {
        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Not authenticated");
        const res = await fetch("/api/admin/tracks", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-token": token },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await safeJson(res)).detail || "Create failed");
      });
    }
    resetForm();
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editing) setForm(editing);
    else resetForm();
  }, [editing]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleActive = (track: TrackItem) => {
    runAction(async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`/api/admin/tracks/${track.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ ...track, is_active: track.is_active ? 0 : 1 }),
      });
      if (!res.ok) throw new Error((await safeJson(res)).detail || "Toggle failed");
    });
  };

  const deletePermanently = (id: number) => {
    if (!confirm("Delete permanently?")) return;
    runAction(async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`/api/admin/tracks/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
        body: JSON.stringify({ permanent: true }),
      });
      if (!res.ok) throw new Error((await safeJson(res)).detail || "Delete failed");
    });
  };

  return (
    <div>
      <h2>Tracks</h2>
      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
        <h3>{editing ? "Edit Track" : "Add Track"}</h3>
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <input className="admin-input" placeholder="Title" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <input className="admin-input" placeholder="Artist Name" value={form.artist_name || ""} onChange={e => setForm({ ...form, artist_name: e.target.value })} required />
            <input className="admin-input" type="number" placeholder="Track Number" value={form.track_number} onChange={e => setForm({ ...form, track_number: +e.target.value })} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <input className="admin-input" placeholder="Year" value={form.year || ""} onChange={e => setForm({ ...form, year: e.target.value })} />
            <input className="admin-input" type="number" placeholder="Streams" value={form.streams} onChange={e => setForm({ ...form, streams: +e.target.value })} />
            <input className="admin-input" placeholder="Type (Single/Album)" value={form.track_type || ""} onChange={e => setForm({ ...form, track_type: e.target.value })} />
          </div>
          <input className="admin-input" placeholder="Featured Artist" value={form.featured_artist || ""} onChange={e => setForm({ ...form, featured_artist: e.target.value })} />
          <input type="hidden" name="artist_id" value={1} />
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary">{editing ? "Update" : "Save"}</button>
            {editing && <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>}
          </div>
        </div>
      </form>

      <div className="list-container">
        {tracks.map(t => (
          <div key={t.id} className="list-item" style={{ opacity: t.is_active ? 1 : 0.5 }}>
            <div className="list-item-info">
              <strong>{t.track_number}. {t.title}</strong>
              <span style={{ color: "var(--text-secondary)", marginLeft: 12 }}>{t.artist_name} · {formatCount(t.streams)} streams {!t.is_active && <span className="badge badge-outline">Inactive</span>}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditing(t)} className="btn btn-outline btn-sm">Edit</button>
              <button onClick={() => toggleActive(t)} className="btn btn-outline btn-sm">{t.is_active ? "Deactivate" : "Activate"}</button>
              <button onClick={() => deletePermanently(t.id)} className="btn btn-outline btn-sm" style={{ color: "#f87171" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Gallery Manager ----------
function GalleryManager({ gallery, runAction, addToast }: { gallery: GalleryItem[]; runAction: (fn: () => Promise<void>) => void; addToast: (message: string, type: "success" | "error" | "info") => void }) {
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState<Partial<GalleryItem>>({ url: "", alt_text: "", order: 0 });

  const resetForm = () => setForm({ url: "", alt_text: "", order: 0 });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setForm({ ...form, url });
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Upload failed", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await runAction(async () => {
        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Not authenticated");
        const res = await fetch(`/api/admin/gallery/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-admin-token": token },
          body: JSON.stringify({ ...form, is_active: editing.is_active }),
        });
        if (!res.ok) throw new Error((await safeJson(res)).detail || "Update failed");
      });
      setEditing(null);
    } else {
      await runAction(async () => {
        const token = localStorage.getItem("admin_token");
        if (!token) throw new Error("Not authenticated");
        const res = await fetch("/api/admin/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-token": token },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await safeJson(res)).detail || "Create failed");
      });
    }
    resetForm();
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (editing) setForm(editing);
    else resetForm();
  }, [editing]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleActive = (item: GalleryItem) => {
    runAction(async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`/api/admin/gallery/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ ...item, is_active: item.is_active ? 0 : 1 }),
      });
      if (!res.ok) throw new Error((await safeJson(res)).detail || "Toggle failed");
    });
  };

  const deletePermanently = (id: number) => {
    if (!confirm("Delete permanently?")) return;
    runAction(async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
        body: JSON.stringify({ permanent: true }),
      });
      if (!res.ok) throw new Error((await safeJson(res)).detail || "Delete failed");
    });
  };

  return (
    <div>
      <h2>Gallery</h2>
      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
        <h3>{editing ? "Edit Image" : "Add Image"}</h3>
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="admin-input" placeholder="Image URL" value={form.url || ""} onChange={e => setForm({ ...form, url: e.target.value })} required style={{ flex: 1 }} />
            <label className="upload-btn">
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              Upload
            </label>
          </div>
          <input className="admin-input" placeholder="Alt Text" value={form.alt_text || ""} onChange={e => setForm({ ...form, alt_text: e.target.value })} required />
          <input className="admin-input" type="number" placeholder="Display Order" value={form.order} onChange={e => setForm({ ...form, order: +e.target.value })} />
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary">{editing ? "Update" : "Save"}</button>
            {editing && <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>}
          </div>
        </div>
      </form>

      <div className="gallery-grid" style={{ marginTop: 0 }}>
        {gallery.map(g => (
          <div key={g.id} className="item" style={{ position: "relative", opacity: g.is_active ? 1 : 0.5 }}>
            <img src={g.url} alt={g.alt_text} loading="lazy" />
            <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
              <button onClick={() => setEditing(g)} className="btn btn-outline btn-sm">Edit</button>
              <button onClick={() => toggleActive(g)} className="btn btn-outline btn-sm">{g.is_active ? "Hide" : "Show"}</button>
              <button onClick={() => deletePermanently(g.id)} className="btn btn-outline btn-sm" style={{ color: "#f87171" }}>Del</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Artist Editor ----------
function ArtistEditor({ artist, runAction, addToast }: { artist: ArtistProfile | null; runAction: (fn: () => Promise<void>) => void; addToast: (message: string, type: "success" | "error" | "info") => void }) {
  const [form, setForm] = useState<ArtistProfile>(artist || {
    id: 0, name: "", title: "", bio: "", followers: 0,
    hero_image_url: "", spotify_url: "", youtube_url: "", instagram_url: ""
  });

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (artist) setForm(artist);
  }, [artist]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setForm({ ...form, hero_image_url: url });
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Upload failed", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAction(async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/admin/artist", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await safeJson(res)).detail || "Save failed");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 32 }}>
      <h2>Artist Profile</h2>
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          <input className="admin-input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input className="admin-input" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea className="admin-input" placeholder="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
          <input className="admin-input" type="number" placeholder="Followers" value={form.followers} onChange={e => setForm({ ...form, followers: +e.target.value })} />
          <div style={{ display: "flex", gap: 8 }}>
            <input className="admin-input" placeholder="Hero Image URL" value={form.hero_image_url || ""} onChange={e => setForm({ ...form, hero_image_url: e.target.value })} style={{ flex: 1 }} />
            <label className="upload-btn">
              <input type="file" accept="image/*" onChange={handleHeroUpload} />
              Upload
            </label>
          </div>
          <input className="admin-input" placeholder="Spotify URL" value={form.spotify_url || ""} onChange={e => setForm({ ...form, spotify_url: e.target.value })} />
          <input className="admin-input" placeholder="YouTube URL" value={form.youtube_url || ""} onChange={e => setForm({ ...form, youtube_url: e.target.value })} />
          <input className="admin-input" placeholder="Instagram URL" value={form.instagram_url || ""} onChange={e => setForm({ ...form, instagram_url: e.target.value })} />
          <button type="submit" className="btn btn-primary">Save Artist</button>
        </div>
    </form>
  );
}

// ---------- Site Content Editor (Hero / About) ----------
function SiteContentEditor({ slug, content, runAction, addToast }: { slug: string; content: SiteContent; runAction: (fn: () => Promise<void>) => void; addToast: (message: string, type: "success" | "error" | "info") => void }) {
  const [form, setForm] = useState<SiteContent>(content);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setForm(content);
  }, [content]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setForm({ ...form, image_url: url });
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Upload failed", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAction(async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await safeJson(res)).detail || "Save failed");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 32 }}>
      <h2>{slug === "hero" ? "Hero Section" : "About Section"}</h2>
      <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
        {slug === "hero" && (
          <>
            <input className="admin-input" placeholder="Title" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input className="admin-input" placeholder="Subtitle" value={form.subtitle || ""} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
            <textarea className="admin-input" placeholder="Body" value={form.body || ""} onChange={e => setForm({ ...form, body: e.target.value })} />
            <div style={{ display: "flex", gap: 8 }}>
              <input className="admin-input" placeholder="Image URL" value={form.image_url || ""} onChange={e => setForm({ ...form, image_url: e.target.value })} style={{ flex: 1 }} />
              <label className="upload-btn">
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                Upload
              </label>
            </div>
            <input className="admin-input" placeholder="Primary CTA Label" value={form.cta_primary_label || ""} onChange={e => setForm({ ...form, cta_primary_label: e.target.value })} />
            <input className="admin-input" placeholder="Primary CTA URL" value={form.cta_primary_url || ""} onChange={e => setForm({ ...form, cta_primary_url: e.target.value })} />
            <input className="admin-input" placeholder="Secondary CTA Label" value={form.cta_secondary_label || ""} onChange={e => setForm({ ...form, cta_secondary_label: e.target.value })} />
            <input className="admin-input" placeholder="Secondary CTA URL" value={form.cta_secondary_url || ""} onChange={e => setForm({ ...form, cta_secondary_url: e.target.value })} />
          </>
        )}
        {slug === "about" && (
          <>
            <input className="admin-input" placeholder="Title" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} />
            <textarea className="admin-input" placeholder="Body" value={form.body || ""} onChange={e => setForm({ ...form, body: e.target.value })} />
          </>
        )}
        <button type="submit" className="btn btn-primary">Save {slug === "hero" ? "Hero" : "About"}</button>
      </div>
    </form>
  );
}