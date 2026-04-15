"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import type { PublicLocationWithTenant } from "@/lib/queries/locations";

// ---------------------------------------------------------------------------
// Dark-mode map style that aligns with --color-bg (#0B0A0E)
// Typed with a local interface so @types/google.maps is not required.
// ---------------------------------------------------------------------------
type MapFeatureType =
  | "administrative"
  | "administrative.locality"
  | "poi"
  | "poi.park"
  | "road"
  | "road.highway"
  | "transit"
  | "transit.station"
  | "water"
  | string;

type MapElementType =
  | "geometry"
  | "geometry.stroke"
  | "labels.text.fill"
  | "labels.text.stroke"
  | string;

interface MapTypeStyler {
  color?: string;
  visibility?: string;
  weight?: number;
  [key: string]: unknown;
}

interface MapTypeStyle {
  featureType?: MapFeatureType;
  elementType?: MapElementType;
  stylers: MapTypeStyler[];
}

const DARK_MAP_STYLES: MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0B0A0E" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B0A0E" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#1a1826" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9CA3AF" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6B7280" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0f0e14" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#374151" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1C1B22" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0B0A0E" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2a2833" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1826" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9CA3AF" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#130f20" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6B7280" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#06050a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#374151" }],
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LocationsMapProps {
  locations: PublicLocationWithTenant[];
  apiKey: string | undefined;
}

// ---------------------------------------------------------------------------
// Custom pin element rendered inside AdvancedMarker
// ---------------------------------------------------------------------------

function LocationPin({
  isSelected,
  label,
}: {
  isSelected: boolean;
  label: string;
}) {
  return (
    <div
      aria-label={label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: isSelected
          ? "var(--color-primary)"
          : "var(--color-primary-subtle)",
        border: `2px solid var(--color-primary)`,
        borderRadius: "999px",
        padding: isSelected ? "5px 10px 5px 6px" : "6px",
        boxShadow: isSelected
          ? "0 0 20px var(--color-primary-glow)"
          : "0 0 10px var(--color-primary-glow)",
        cursor: "pointer",
        transform: isSelected ? "scale(1.15)" : "scale(1)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: "14px", lineHeight: 1 }}>📍</span>
      {isSelected && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--color-text)",
            maxWidth: "120px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner map component (must be inside APIProvider to call useMap)
// ---------------------------------------------------------------------------

function InteractiveMap({
  locations,
  selectedId,
  onSelectId,
}: {
  locations: PublicLocationWithTenant[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
}) {
  const map = useMap();
  const selectedLocation = locations.find((l) => l.id === selectedId) ?? null;

  // Compute a sensible initial centre / bound
  const validLocations = locations.filter(
    (l) => l.latitude != null && l.longitude != null
  );

  const centerLat =
    validLocations.length > 0
      ? validLocations.reduce((s, l) => s + Number(l.latitude), 0) /
        validLocations.length
      : 39.5;

  const centerLng =
    validLocations.length > 0
      ? validLocations.reduce((s, l) => s + Number(l.longitude), 0) /
        validLocations.length
      : -98.35;

  // Pan-to-selected when selection changes
  useEffect(() => {
    if (!map || !selectedLocation) return;
    map.panTo({
      lat: Number(selectedLocation.latitude),
      lng: Number(selectedLocation.longitude),
    });
    map.setZoom(14);
  }, [map, selectedLocation]);

  return (
    <>
      <Map
        defaultCenter={{ lat: centerLat, lng: centerLng }}
        defaultZoom={validLocations.length === 1 ? 13 : 4}
        gestureHandling="cooperative"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        zoomControl={true}
        styles={DARK_MAP_STYLES}
        style={{ width: "100%", height: "100%" }}
        mapId="brand-network-locations"
        onClick={() => onSelectId(null)}
      >
        {validLocations.map((loc) => (
          <AdvancedMarker
            key={loc.id}
            position={{
              lat: Number(loc.latitude),
              lng: Number(loc.longitude),
            }}
            onClick={() => onSelectId(loc.id === selectedId ? null : loc.id)}
            title={loc.name}
          >
            <LocationPin
              isSelected={loc.id === selectedId}
              label={loc.name}
            />
          </AdvancedMarker>
        ))}

        {selectedLocation &&
          selectedLocation.latitude != null &&
          selectedLocation.longitude != null && (
            <InfoWindow
              position={{
                lat: Number(selectedLocation.latitude),
                lng: Number(selectedLocation.longitude),
              }}
              onCloseClick={() => onSelectId(null)}
              pixelOffset={[0, -40]}
            >
              <div
                style={{
                  background: "var(--color-bg-elevated)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  minWidth: "200px",
                  fontFamily: "inherit",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-primary)",
                    margin: "0 0 4px",
                  }}
                >
                  {selectedLocation.tenantName}
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    margin: "0 0 6px",
                    color: "var(--color-text)",
                  }}
                >
                  {selectedLocation.name}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                    margin: "0 0 10px",
                    lineHeight: 1.5,
                  }}
                >
                  {selectedLocation.addressLine1}
                  {selectedLocation.addressLine2
                    ? `, ${selectedLocation.addressLine2}`
                    : ""}
                  <br />
                  {selectedLocation.city}
                  {selectedLocation.state
                    ? `, ${selectedLocation.state}`
                    : ""}{" "}
                  {selectedLocation.postalCode}
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.latitude},${selectedLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--color-primary)",
                    textDecoration: "none",
                    border: "1px solid var(--color-border-glow)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                  }}
                >
                  Get Directions →
                </a>
              </div>
            </InfoWindow>
          )}
      </Map>
    </>
  );
}

// ---------------------------------------------------------------------------
// LocationsMap — main export
//
// 1. Requests browser geolocation on mount (updates URL to trigger server re-sort)
// 2. Renders one large interactive master map (APIProvider + Map) — no iframes
// 3. Renders a grid of store cards beneath the map
// ---------------------------------------------------------------------------

export function LocationsMap({ locations, apiKey }: LocationsMapProps) {
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const didRequest = useRef(false);

  // Geolocation → URL update (triggers server re-sort via Haversine)
  useEffect(() => {
    if (didRequest.current) return;
    didRequest.current = true;

    if (!("geolocation" in navigator)) {
      setGeoStatus("denied");
      return;
    }

    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoStatus("granted");
        const url = new URL(window.location.href);
        url.searchParams.set("lat", String(pos.coords.latitude));
        url.searchParams.set("lng", String(pos.coords.longitude));
        window.history.replaceState(null, "", url.toString());
        window.location.replace(url.toString());
      },
      () => {
        setGeoStatus("denied");
      },
      { timeout: 8000 }
    );
  }, []);

  // When a pin is selected, scroll the matching card into view
  const handleSelectId = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id && cardRefs.current[id]) {
      cardRefs.current[id]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, []);

  const hasValidLocations = locations.some(
    (l) => l.latitude != null && l.longitude != null
  );

  return (
    <div className="space-y-10">
      {/* Geo status banner */}
      {geoStatus === "requesting" && (
        <p
          role="status"
          className="text-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          Detecting your location to sort by nearest store…
        </p>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Master interactive map                                              */}
      {/* ------------------------------------------------------------------ */}
      {hasValidLocations && apiKey ? (
        <div
          aria-label="Franchise locations map"
          style={{
            position: "relative",
            height: "480px",
            borderRadius: "var(--radius-card)",
            overflow: "hidden",
            border: "1px solid var(--color-border)",
            boxShadow:
              "0 0 60px var(--color-primary-glow), 0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          <APIProvider apiKey={apiKey}>
            <InteractiveMap
              locations={locations}
              selectedId={selectedId}
              onSelectId={handleSelectId}
            />
          </APIProvider>

          {/* Map overlay legend */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "var(--color-bg-glass)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid var(--color-border-glow)",
              borderRadius: "10px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--color-text-muted)",
              pointerEvents: "none",
            }}
          >
            📍{" "}
            {locations.length} location{locations.length !== 1 ? "s" : ""}
          </div>
        </div>
      ) : hasValidLocations && !apiKey ? (
        /* Fallback when no API key */
        <div
          className="glass-card flex h-32 items-center justify-center text-sm"
          style={{ color: "var(--color-text-muted)" }}
          aria-label="Map unavailable"
        >
          Interactive map unavailable — API key not configured.
        </div>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Store cards grid — Pearled Velvet Glass dark theme                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => {
          const isSelected = loc.id === selectedId;
          return (
            <div
              key={loc.id}
              ref={(el) => {
                cardRefs.current[loc.id] = el;
              }}
              onClick={() =>
                loc.latitude != null && loc.longitude != null
                  ? handleSelectId(loc.id === selectedId ? null : loc.id)
                  : undefined
              }
              role={
                loc.latitude != null && loc.longitude != null
                  ? "button"
                  : undefined
              }
              tabIndex={
                loc.latitude != null && loc.longitude != null ? 0 : undefined
              }
              onKeyDown={(e) => {
                if (
                  (e.key === "Enter" || e.key === " ") &&
                  loc.latitude != null &&
                  loc.longitude != null
                ) {
                  e.preventDefault();
                  handleSelectId(loc.id === selectedId ? null : loc.id);
                }
              }}
              className="glass-card overflow-hidden transition-all duration-200"
              style={{
                borderColor: isSelected
                  ? "var(--color-primary)"
                  : "var(--color-border)",
                boxShadow: isSelected
                  ? "0 0 0 1px var(--color-primary), 0 0 24px var(--color-primary-glow)"
                  : undefined,
                cursor:
                  loc.latitude != null && loc.longitude != null
                    ? "pointer"
                    : "default",
              }}
            >
              {/* Pink accent indicator strip */}
              {loc.latitude != null && loc.longitude != null && (
                <div
                  style={{
                    height: "3px",
                    background: isSelected
                      ? "var(--color-primary)"
                      : "transparent",
                    transition: "background 0.2s ease",
                  }}
                />
              )}

              {/* Location details */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className="text-xs font-medium uppercase tracking-widest"
                      style={{ color: "var(--color-text-subtle)" }}
                    >
                      {loc.tenantName}
                    </p>
                    <h3
                      className="mt-0.5 font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {loc.name}
                    </h3>
                  </div>
                  {loc.tenantLogoUrl && (
                    <img
                      src={loc.tenantLogoUrl}
                      alt={loc.tenantName}
                      className="h-8 w-auto flex-shrink-0 object-contain"
                    />
                  )}
                </div>

                <address
                  className="mt-3 not-italic text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {loc.addressLine1}
                  {loc.addressLine2 && (
                    <>
                      <br />
                      {loc.addressLine2}
                    </>
                  )}
                  <br />
                  {loc.city}
                  {loc.state ? `, ${loc.state}` : ""} {loc.postalCode}
                </address>

                {loc.phone && (
                  <a
                    href={`tel:${loc.phone.replace(/\D/g, "")}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 block text-sm transition-colors duration-150"
                    style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color =
                        "var(--color-text)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.color =
                        "var(--color-text-muted)")
                    }
                  >
                    {loc.phone}
                  </a>
                )}

                <div className="mt-4 flex items-center gap-3">
                  {loc.latitude != null && loc.longitude != null && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectId(
                          loc.id === selectedId ? null : loc.id
                        );
                      }}
                      className="btn-ghost inline-flex h-9 items-center justify-center px-3 text-xs"
                    >
                      {isSelected ? "Deselect pin" : "Show on map"}
                    </button>
                  )}
                  <a
                    href={`https://${loc.tenantSubdomain}.${process.env["NEXT_PUBLIC_ROOT_DOMAIN"] ?? "brand-network.com"}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn-primary inline-flex h-9 items-center justify-center px-4 text-xs"
                  >
                    Visit storefront →
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
