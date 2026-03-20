import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameMediaGallery } from "@/components/games/details/GameMediaGallery";

// Mock LazyImage to a simple img element
vi.mock("@/components/ui/lazy-image", () => ({
  LazyImage: (props: { src: string; alt: string }) => (
    <img src={props.src} alt={props.alt} data-testid="lazy-image" />
  ),
}));

const makeVideo = (id: string, videoId: string, title: string) => ({
  id,
  url: `https://www.youtube.com/watch?v=${videoId}`,
  thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  title,
});

const makeScreenshot = (id: string) => ({
  id,
  url: `https://example.com/screenshot-${id}.jpg`,
  title: `Screenshot ${id}`,
});

const makeArtwork = (id: string) => ({
  id,
  url: `https://example.com/artwork-${id}.jpg`,
  title: `Artwork ${id}`,
});

describe("GameMediaGallery — video tests", () => {
  it("renders a YouTube iframe with correct embed URL", () => {
    const media = {
      screenshots: [],
      artwork: [],
      videos: [makeVideo("v1", "dQw4w9WgXcQ", "Trailer officiel")],
    };

    const { container } = render(<GameMediaGallery media={media} gameTitle="Test Game" />);

    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute("src")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("sets correct allow and allowFullScreen attributes on iframe", () => {
    const media = {
      screenshots: [],
      artwork: [],
      videos: [makeVideo("v1", "abc123", "Trailer")],
    };

    const { container } = render(<GameMediaGallery media={media} gameTitle="Test Game" />);

    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();

    const allow = iframe!.getAttribute("allow") ?? "";
    for (const val of [
      "accelerometer",
      "autoplay",
      "clipboard-write",
      "encrypted-media",
      "gyroscope",
      "picture-in-picture",
    ]) {
      expect(allow).toContain(val);
    }
    expect(iframe!.allowFullscreen).toBe(true);
  });

  it("renders videos section before screenshots and artwork", () => {
    const media = {
      screenshots: [makeScreenshot("s1")],
      artwork: [makeArtwork("a1")],
      videos: [makeVideo("v1", "xyz789", "Gameplay")],
    };

    const { container } = render(<GameMediaGallery media={media} gameTitle="Test Game" />);

    const headings = container.querySelectorAll("h3");
    const headingTexts = Array.from(headings).map((h) => h.textContent);

    // Videos heading should come first
    expect(headingTexts[0]).toBe("media.videos");
  });

  it("does not render videos section when no videos exist", () => {
    const media = {
      screenshots: [makeScreenshot("s1")],
      artwork: [makeArtwork("a1")],
      videos: [],
    };

    const { container } = render(<GameMediaGallery media={media} gameTitle="Test Game" />);

    const headings = container.querySelectorAll("h3");
    const headingTexts = Array.from(headings).map((h) => h.textContent);

    expect(headingTexts).not.toContain("media.videos");
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("displays video title below the thumbnail", () => {
    const media = {
      screenshots: [],
      artwork: [],
      videos: [
        makeVideo("v1", "id1", "Bande-annonce officielle"),
        makeVideo("v2", "id2", "Gameplay reveal"),
      ],
    };

    render(<GameMediaGallery media={media} gameTitle="Test Game" />);

    expect(screen.getByText("Bande-annonce officielle")).toBeDefined();
    expect(screen.getByText("Gameplay reveal")).toBeDefined();
  });

  it("uses the translation key for the videos section heading", () => {
    const media = {
      screenshots: [],
      artwork: [],
      videos: [makeVideo("v1", "abc", "Trailer")],
    };

    render(<GameMediaGallery media={media} gameTitle="Test Game" />);

    // The mock useTranslations returns the key itself: "media.videos"
    expect(screen.getByText("media.videos")).toBeDefined();
  });
});
