import { db } from "@/lib/db";
import Head from "next/head";
import { useState, useEffect, type FormEvent } from "react";

type ArtistRow = {
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

type VideoRow = {
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

type TrackRow = {
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

type GalleryRow = {
  id: number;
  url: string;
  alt_text: string;
  order: number;
  is_active: number;
};

type SiteContentRow = {
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

export async function getStaticProps() {
  const artist = await db.execute("SELECT * FROM artists LIMIT 1");
  const videos = await db.execute("SELECT * FROM videos WHERE is_active IS NOT 0 ORDER BY created_at DESC LIMIT 10");
  const tracks = await db.execute("SELECT * FROM tracks WHERE is_active IS NOT 0 ORDER BY track_number LIMIT 10");
  const gallery = await db.execute(`SELECT * FROM gallery_images WHERE is_active IS NOT 0 ORDER BY "order"`);
  const siteContent = await db.execute("SELECT * FROM site_content ORDER BY slug");

  return {
    props: {
      artist: (artist.rows[0] as unknown as ArtistRow) || null,
      videos: videos.rows as unknown as VideoRow[],
      tracks: tracks.rows as unknown as TrackRow[],
      gallery: gallery.rows as unknown as GalleryRow[],
      siteContent: siteContent.rows as unknown as SiteContentRow[],
    },
    revalidate: 3600,
  };
}

function formatCount(value: number) {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "K";
  return value.toString();
}

export default function Home({
  artist,
  videos,
  tracks,
  gallery,
  siteContent,
}: {
  artist: ArtistRow | null;
  videos: VideoRow[];
  tracks: TrackRow[];
  gallery: GalleryRow[];
  siteContent: SiteContentRow[];
}) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const saved = window.localStorage.getItem("theme");
    return saved !== "light";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Parallax hero
  useEffect(() => {
    const heroImg = document.querySelector(".hero-image-wrapper") as HTMLElement;
    if (!heroImg) return;
    const onMouseMove = (e: MouseEvent) => {
      const speed = 0.02;
      const x = (window.innerWidth - e.pageX * 4) * speed;
      const y = (window.innerHeight - e.pageY * 4) * speed;
      heroImg.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // Header shrink
  useEffect(() => {
    const header = document.querySelector(".site-header") as HTMLElement;
    if (!header) return;
    const onScroll = () => {
      header.style.padding = window.scrollY > 50 ? "8px 64px" : "16px 64px";
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const handleNewsletter = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubStatus("Subscribing...");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error");
      setSubStatus("Subscribed successfully! 🎉");
      setEmail("");
    } catch (err) {
      setSubStatus(err instanceof Error ? err.message : "Subscription failed");
    }
  };

  const heroContent = siteContent.find((item) => item.slug === "hero");
  const aboutContent = siteContent.find((item) => item.slug === "about");

  const featuredVideo = videos.find((video) => video.is_featured) || videos[0];
  const trendingVideos = videos.slice(0, 3);
  const showVideos = videos;

  return (
    <>
      <Head>
        <title>Vida Brown | Elevating Visual Storytelling</title>
      </Head>

      {/* Header */}
      <header className="site-header">
        <div className="logo">VIDA BROWN</div>
        {/* Desktop Nav */}
        <nav className="main-nav">
          <a href="#hero-section" className="active" onClick={closeMobile}>Home</a>
          <a href="#about-section" onClick={closeMobile}>About</a>
          <a href="#shows-section" onClick={closeMobile}>Shows</a>
          <a href="#gallery-section" onClick={closeMobile}>Gallery</a>
          <a href="#music-section" onClick={closeMobile}>Music</a>
          <a href="#products-section" onClick={closeMobile}>Products</a>
          <a href="#contact-section" onClick={closeMobile}>Contact</a>
        </nav>
        <div className="header-actions">
          <button onClick={() => setIsDark(!isDark)} className="theme-toggle" title="Toggle theme">
            <span className="material-symbols-outlined">{isDark ? "dark_mode" : "light_mode"}</span>
          </button>
          <button className="btn btn-primary" onClick={() => {
            const contactSection = document.getElementById("contact-section");
            if (contactSection) contactSection.scrollIntoView({ behavior: "smooth" });
          }}>Connect</button>
          {/* Hamburger */}
          <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className="material-symbols-outlined">{mobileOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="nav-overlay active"
          aria-label="Close mobile menu"
          onClick={closeMobile}
        />
      )}
      <div className={`mobile-nav ${mobileOpen ? "active" : ""}`}>
        <a href="#hero-section" onClick={closeMobile}>Home</a>
        <a href="#about-section" onClick={closeMobile}>About</a>
        <a href="#shows-section" onClick={closeMobile}>Shows</a>
        <a href="#gallery-section" onClick={closeMobile}>Gallery</a>
        <a href="#music-section" onClick={closeMobile}>Music</a>
        <a href="#products-section" onClick={closeMobile}>Products</a>
        <a href="#contact-section" onClick={closeMobile}>Contact</a>
      </div>

      <main>
        {/* Hero Section */}
        <section className="hero" id="hero-section">
          <div className="glow glow-hero-1"></div>
          <div className="glow glow-hero-2"></div>
          <div className="container hero-container">
            <div className="hero-content">
              <h1>{heroContent?.title || artist?.name || "Vida Brown"}</h1>
              <h2>{heroContent?.subtitle || artist?.title || "Singer • Songwriter • Producer"}</h2>
              <p>{heroContent?.body || artist?.bio || "Malawian artist creating music, arts, and culture content."}</p>
              <div className="hero-buttons">
                <a href={heroContent?.cta_primary_url || artist?.spotify_url || "https://open.spotify.com/artist/3ihbWDeubJO4XmeZlCGqZL"} target="_blank" className="btn btn-primary">
                  <span className="material-symbols-outlined">music_note</span> {heroContent?.cta_primary_label || "Listen on Spotify"}
                </a>
                <a href={heroContent?.cta_secondary_url || artist?.youtube_url || "https://www.youtube.com/@VidaBrownOfficial"} target="_blank" className="btn btn-outline">
                  <span className="material-symbols-outlined">subscriptions</span> {heroContent?.cta_secondary_label || "YouTube Channel"}
                </a>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-image-wrapper">
                <img src={heroContent?.image_url || artist?.hero_image_url || "/Image Jul 22, 2026, 12_54_27 AM.png"} alt="Artist portrait" />
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="section" id="about-section">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="section-tag">About</span>
                <h2>{aboutContent?.title || "About"}</h2>
                <p>{aboutContent?.body || artist?.bio}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Now Section */}
        <section className="section" id="trending-section">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="section-tag">Newest Release</span>
                <h2>Trending Now</h2>
              </div>
              <a className="view-all" href="https://www.youtube.com/@VidaBrownOfficial" target="_blank">
                VIEW ALL VIDEOS <span className="material-symbols-outlined">arrow_forward</span>
              </a>
            </div>

            {/* Featured video */}
            {featuredVideo && (
              <div className="glass-card featured-video">
                <div className="video-wrapper">
                  <iframe src={featuredVideo.embed_url} title={featuredVideo.title} style={{ border: 0 }} allowFullScreen />
                </div>
                <div className="video-info">
                  <div className="badges">
                    <span className={`badge ${featuredVideo.category === "REACTION" ? "badge-secondary" : "badge-primary"}`}>
                      {featuredVideo.category}
                    </span>
                    <span className="badge badge-outline">{featuredVideo.upload_date}</span>
                  </div>
                  <h3>{featuredVideo.title}</h3>
                  <p>{featuredVideo.description}</p>
                  <div className="video-stats">
                    <span><span className="material-symbols-outlined">visibility</span> {formatCount(featuredVideo.views)} views</span>
                    <span><span className="material-symbols-outlined">thumb_up</span> {formatCount(featuredVideo.likes)} likes</span>
                    <span><span className="material-symbols-outlined">schedule</span> {featuredVideo.duration}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Trending grid (3 videos) */}
            <div className="video-grid">
              {trendingVideos.map((video) => (
                <div key={video.id} className="glass-card video-card">
                  <div className="video-wrapper">
                    <iframe src={video.embed_url} title={video.title} style={{ border: 0 }} allowFullScreen loading="lazy" />
                  </div>
                  <div className="video-card-info">
                    <div className="badges">
                      <span className={`badge ${video.category === "REACTION" ? "badge-secondary" : "badge-primary"}`}>
                        {video.category}
                      </span>
                      <span className="meta-time">• {video.duration}</span>
                    </div>
                    <h4>{video.title}</h4>
                    <p>{video.description}</p>
                    <div className="video-stats">
                      <span>{formatCount(video.views)} views</span>
                      <span>•</span>
                      <span>{video.upload_date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* YouTube Shows Section */}
        <section className="section bg-surface" id="shows-section">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="section-tag">YouTube Series</span>
                <h2>Latest Shows</h2>
                <p style={{ marginTop: 16, maxWidth: 600 }}>
                  Watch the latest episodes of HIT OR MISS, music reviews, and reactions on the official Vida Brown YouTube channel.
                </p>
              </div>
              <a className="view-all" href="https://www.youtube.com/@VidaBrownOfficial" target="_blank">
                VIEW ALL ON YOUTUBE <span className="material-symbols-outlined">arrow_forward</span>
              </a>
            </div>

            {/* Shows featured video (first video) */}
            {showVideos.length > 0 && (
              <div className="glass-card featured-video" style={{ marginBottom: 32 }}>
                <div className="video-wrapper">
                  <iframe src={showVideos[0].embed_url} title={showVideos[0].title} style={{ border: 0 }} allowFullScreen />
                </div>
                <div className="video-info">
                  <div className="badges">
                    <span className={`badge ${showVideos[0].category === "REACTION" ? "badge-secondary" : "badge-primary"}`}>
                      {showVideos[0].category}
                    </span>
                    <span className="badge badge-outline">{showVideos[0].upload_date}</span>
                  </div>
                  <h3>{showVideos[0].title}</h3>
                  <p>{showVideos[0].description}</p>
                  <div className="video-stats">
                    <span><span className="material-symbols-outlined">visibility</span> {formatCount(showVideos[0].views)} views</span>
                    <span><span className="material-symbols-outlined">thumb_up</span> {formatCount(showVideos[0].likes)} likes</span>
                    <span><span className="material-symbols-outlined">schedule</span> {showVideos[0].duration}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Shows grid (all videos) */}
            <div className="video-grid">
              {showVideos.slice(1).map((video) => (
                <div key={video.id} className="glass-card video-card">
                  <div className="video-wrapper">
                    <iframe src={video.embed_url} title={video.title} style={{ border: 0 }} allowFullScreen loading="lazy" />
                  </div>
                  <div className="video-card-info">
                    <div className="badges">
                      <span className={`badge ${video.category === "REACTION" ? "badge-secondary" : "badge-primary"}`}>
                        {video.category}
                      </span>
                      <span className="meta-time">• {video.duration}</span>
                    </div>
                    <h4>{video.title}</h4>
                    <p>{video.description}</p>
                    <div className="video-stats">
                      <span>{formatCount(video.views)} views</span>
                      <span>•</span>
                      <span>{video.upload_date}</span>
                    </div>
                  </div>
                </div>
              ))}
              {/* Subscribe card */}
              <a href="https://www.youtube.com/@VidaBrownOfficial" target="_blank" className="glass-card video-card subscribe-card">
                <div className="subscribe-icon">
                  <span className="material-symbols-outlined">subscriptions</span>
                </div>
                <h4>Subscribe to Channel</h4>
                <p>Get the latest music reviews and reactions</p>
                <span className="view-all" style={{ justifyContent: "center" }}>
                  VIEW CHANNEL <span className="material-symbols-outlined">arrow_forward</span>
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="section" id="gallery-section">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="section-tag">Visuals</span>
                <h2>Gallery</h2>
              </div>
            </div>
            <div className="gallery-grid">
              {gallery.map((img) => (
                <div key={img.id} className="item">
                  <img src={img.url} alt={img.alt_text} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Music Section */}
        <section className="section bg-surface" id="music-section">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="section-tag">Discography</span>
                <h2>Listen on Spotify</h2>
              </div>
              <a className="view-all" href="https://open.spotify.com/artist/3ihbWDeubJO4XmeZlCGqZL" target="_blank">
                OPEN IN SPOTIFY <span className="material-symbols-outlined">arrow_forward</span>
              </a>
            </div>
            <div className="glass-card" style={{ padding: 48 }}>
              <div className="music-content">
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="spotify-wrapper">
                    <iframe
                      title="Spotify artist embed"
                      style={{ border: 0, borderRadius: 12 }}
                      src="https://open.spotify.com/embed/artist/3ihbWDeubJO4XmeZlCGqZL?utm_source=generator&theme=0"
                      width="100%"
                      height="100%"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  </div>
                  <a href="https://open.spotify.com/artist/3ihbWDeubJO4XmeZlCGqZL" target="_blank" className="btn btn-spotify" style={{ marginTop: 32 }}>
                    <span className="material-symbols-outlined">music_note</span> Follow on Spotify
                  </a>
                </div>
                <div>
                  <div className="music-header">
                    <div>
                      <h3>{artist?.name || "Vida Brown"}</h3>
                      <p style={{ color: "var(--text-secondary)" }}>{artist?.title}</p>
                      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 8 }}>
                        Malawian Artist • <span>{artist?.followers || 0}</span> Followers
                      </p>
                    </div>
                    <div className="music-actions">
                      <button className="icon-btn"><span className="material-symbols-outlined">favorite</span></button>
                      <button className="icon-btn"><span className="material-symbols-outlined">playlist_add</span></button>
                      <button className="icon-btn"><span className="material-symbols-outlined">share</span></button>
                    </div>
                  </div>
                  <div className="track-list">
                    {tracks.map((track) => (
                      <div key={track.id} className="track-item">
                        <div className="track-info">
                          <span className="track-num">{String(track.track_number).padStart(2, "0")}</span>
                          <div>
                            <div className="track-title">{track.title}</div>
                            <div className="track-artist">
                              {track.artist_name}{track.featured_artist ? ` feat. ${track.featured_artist}` : ""}{track.year ? ` • ${track.year}` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="track-meta">
                          <span>{formatCount(track.streams)} streams</span>
                          <span>{track.track_type}</span>
                          <button className="track-more"><span className="material-symbols-outlined">more_horiz</span></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="social-buttons">
                    <a href="https://www.youtube.com/@VidaBrownOfficial" target="_blank" className="btn btn-outline" style={{ flex: 1, justifyContent: "center", color: "#f87171" }}>
                      <span className="material-symbols-outlined">subscriptions</span> YouTube
                    </a>
                    <a href="https://www.instagram.com/vidabrownofficial" target="_blank" className="btn btn-outline" style={{ flex: 1, justifyContent: "center", color: "#f472b6" }}>
                      <span className="material-symbols-outlined">photo_camera</span> Instagram
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="section" id="products-section">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="section-tag">Coming Soon</span>
                <h2>Merchandise</h2>
              </div>
            </div>
            <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
              <span className="material-symbols-outlined section-icon">shopping_bag</span>
              <h3>Merch Store Opening Soon</h3>
              <p>Official Vida Brown merchandise coming soon. Stay tuned for exclusive apparel, accessories, and more.</p>
            </div>
          </div>
        </section>

        {/* Contact / Newsletter */}
        <section className="section" id="contact-section">
          <div className="container">
            <div className="glass-card contact-card">
              <div className="glow glow-primary"></div>
              <div className="glow glow-secondary"></div>
              <div className="contact-content">
                <span className="section-tag">Stay Connected</span>
                <h2>Join the Community</h2>
                <p style={{ maxWidth: 800, margin: "0 auto 32px" }}>
                  Subscribe for the latest music reviews, reactions, and exclusive content from Vida Brown.
                </p>
                <form onSubmit={handleNewsletter} style={{ display: "flex", gap: 12, maxWidth: 500, margin: "0 auto 32px", flexWrap: "wrap", justifyContent: "center" }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    style={{
                      flex: 1,
                      minWidth: 200,
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)",
                      color: "inherit",
                      outline: "none",
                      fontSize: 16,
                    }}
                  />
                  <button type="submit" className="btn btn-primary">Subscribe</button>
                </form>
                {subStatus && (
                  <p style={{
                    textAlign: "center",
                    color: subStatus.includes("success") ? "var(--secondary)" : "var(--text-secondary)",
                    marginBottom: 16,
                  }}>
                    {subStatus}
                  </p>
                )}
                <div className="hero-buttons" style={{ justifyContent: "center" }}>
                  <a href="https://www.youtube.com/@VidaBrownOfficial" target="_blank" className="btn btn-youtube">
                    <span className="material-symbols-outlined">subscriptions</span> Subscribe on YouTube
                  </a>
                  <a href="https://open.spotify.com/artist/3ihbWDeubJO4XmeZlCGqZL" target="_blank" className="btn btn-spotify">
                    <span className="material-symbols-outlined">music_note</span> Follow on Spotify
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="logo">VIDA BROWN</div>
          <p style={{ opacity: 0.8 }}>© 2024-2026 Vida Ezra Gérmaño. All Rights Reserved.</p>
          <p style={{ opacity: 0.6, fontSize: 14 }}>Malawian Artist • Music • Arts • Culture</p>
        </div>
        <div className="footer-links">
          <a href="https://www.youtube.com/@VidaBrownOfficial" target="_blank">YouTube</a>
          <a href="https://open.spotify.com/artist/3ihbWDeubJO4XmeZlCGqZL" target="_blank">Spotify</a>
          <a href="https://www.instagram.com/vidabrownofficial" target="_blank">Instagram</a>
          <a href="https://www.facebook.com/vidabrownofficial" target="_blank">Facebook</a>
        </div>
        <div className="footer-socials">
          <a href="https://www.youtube.com/@VidaBrownOfficial" target="_blank"><span className="material-symbols-outlined">subscriptions</span></a>
          <a href="https://open.spotify.com/artist/3ihbWDeubJO4XmeZlCGqZL" target="_blank"><span className="material-symbols-outlined">music_note</span></a>
        </div>
      </footer>
    </>
  );
}