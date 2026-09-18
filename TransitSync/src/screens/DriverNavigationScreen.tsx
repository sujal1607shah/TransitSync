import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Linking,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import useAuthStore from "../store/AuthStore";
import { authColors } from "../colors/colors";

const { width } = Dimensions.get("window");

// Safely load MapLibreGL & react-native-maps if native module is linked in binary
let MapLibreGL: any = null;
let isMapLibreLinked = false;

try {
  const MapLibreModule = require("@maplibre/maplibre-react-native");
  MapLibreGL = MapLibreModule.default || MapLibreModule;
  if (MapLibreGL && MapLibreGL.MapView) {
    isMapLibreLinked = true;
    if (typeof MapLibreGL.setAccessToken === "function") {
      MapLibreGL.setAccessToken(null);
    }
  }
} catch (e) {
  isMapLibreLinked = false;
}

// Map Error Boundary to catch native rendering exceptions (e.g. missing API keys or unlinked native managers)
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("Map native render error caught by boundary, showing fallback view:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Location Preset Data
export interface LocationPreset {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const PRESET_LOCATIONS: LocationPreset[] = [
  {
    id: "loc-1",
    name: "Ahmedabad Multi-Modal Logistics Hub",
    address: "Changodar Industrial Area, Ahmedabad, Gujarat 382213",
    latitude: 22.9234,
    longitude: 72.4418,
  },
  {
    id: "loc-2",
    name: "Adani Mundra Port Freight Terminal",
    address: "APSEZ Port Zone, Kutch, Gujarat 370421",
    latitude: 22.7441,
    longitude: 69.7058,
  },
  {
    id: "loc-3",
    name: "Surat Textile & Diamond Cargo Hub",
    address: "Sahara Gate, Ring Road, Surat, Gujarat 395002",
    latitude: 21.1959,
    longitude: 72.8302,
  },
  {
    id: "loc-4",
    name: "Vadodara GIDC Industrial Corridor Yard",
    address: "Makarpura GIDC, Vadodara, Gujarat 390010",
    latitude: 22.2530,
    longitude: 73.1970,
  },
  {
    id: "loc-5",
    name: "Rajkot Engineering & Cargo Hub",
    address: "Aji GIDC Phase II, Rajkot, Gujarat 360003",
    latitude: 22.2785,
    longitude: 70.8213,
  },
  {
    id: "loc-6",
    name: "JNPT Container Inland Terminal - Mumbai",
    address: "Navi Mumbai, Maharashtra 400707",
    latitude: 18.9504,
    longitude: 72.9520,
  },
  {
    id: "loc-7",
    name: "Delhi-NCR Interstate Freight Hub",
    address: "NH-48 Corridor, Gurgaon, Haryana 122001",
    latitude: 28.4595,
    longitude: 77.0266,
  },
];

export default function DriverNavigationScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // Authorization check (Facility only for Drivers)
  const [demoDriverAccess, setDemoDriverAccess] = useState<boolean>(false);
  const isDriver = user?.role === "ROLE_DRIVER" || demoDriverAccess;

  // Selected Pickup & Destination
  const [pickup, setPickup] = useState<LocationPreset>(PRESET_LOCATIONS[0]);
  const [destination, setDestination] = useState<LocationPreset>(PRESET_LOCATIONS[1]);

  const [pickupInput, setPickupInput] = useState(PRESET_LOCATIONS[0].name);
  const [destInput, setDestInput] = useState(PRESET_LOCATIONS[1].name);

  const [showPickupPresets, setShowPickupPresets] = useState(false);
  const [showDestPresets, setShowDestPresets] = useState(false);

  // Navigation Status State
  const [navState, setNavState] = useState<"IDLE" | "EN_ROUTE_PICKUP" | "EN_ROUTE_DEST" | "COMPLETED">("IDLE");

  // Calculate Region & Distance
  const region = {
    latitude: (pickup.latitude + destination.latitude) / 2,
    longitude: (pickup.longitude + destination.longitude) / 2,
    latitudeDelta: Math.max(Math.abs(pickup.latitude - destination.latitude) * 1.6, 0.05),
    longitudeDelta: Math.max(Math.abs(pickup.longitude - destination.longitude) * 1.6, 0.05),
  };

  // Generate intermediate route coordinates for smooth polyline display
  const routeCoordinates = [
    { latitude: pickup.latitude, longitude: pickup.longitude },
    {
      latitude: pickup.latitude + (destination.latitude - pickup.latitude) * 0.3 + 0.003,
      longitude: pickup.longitude + (destination.longitude - pickup.longitude) * 0.2 - 0.002,
    },
    {
      latitude: pickup.latitude + (destination.latitude - pickup.latitude) * 0.7 - 0.002,
      longitude: pickup.longitude + (destination.longitude - pickup.longitude) * 0.8 + 0.003,
    },
    { latitude: destination.latitude, longitude: destination.longitude },
  ];

  // MapLibre GeoJSON Route Format
  const routeGeoJson: any = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: routeCoordinates.map((c) => [c.longitude, c.latitude]),
    },
  };

  // Calculated distance & ETA mock logic based on coordinates
  const latDiff = Math.abs(pickup.latitude - destination.latitude);
  const lngDiff = Math.abs(pickup.longitude - destination.longitude);
  const estimatedKm = (Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111).toFixed(1);
  const estimatedTimeMins = Math.round(parseFloat(estimatedKm) * 2.2 + 5);

  const handleSelectPickup = (loc: LocationPreset) => {
    setPickup(loc);
    setPickupInput(loc.name);
    setShowPickupPresets(false);
  };

  const handleSelectDestination = (loc: LocationPreset) => {
    setDestination(loc);
    setDestInput(loc.name);
    setShowDestPresets(false);
  };

  const handleSwapLocations = () => {
    const tempLoc = pickup;
    const tempInput = pickupInput;

    setPickup(destination);
    setPickupInput(destInput);

    setDestination(tempLoc);
    setDestInput(tempInput);
  };

  const handleFitRoute = () => {
    if (isMapLibreLinked && cameraRef.current?.fitBounds) {
      const minLat = Math.min(pickup.latitude, destination.latitude);
      const maxLat = Math.max(pickup.latitude, destination.latitude);
      const minLng = Math.min(pickup.longitude, destination.longitude);
      const maxLng = Math.max(pickup.longitude, destination.longitude);

      cameraRef.current.fitBounds(
        [maxLng, maxLat],
        [minLng, minLat],
        [60, 60, 60, 60],
        1000
      );
    } else {
      Alert.alert("Route Recentered", `Centered route from ${pickup.name} to ${destination.name}`);
    }
  };

  const handleOpenExternalNavigation = () => {
    const originParam = `${pickup.latitude},${pickup.longitude}`;
    const destParam = `${destination.latitude},${destination.longitude}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      originParam
    )}&destination=${encodeURIComponent(destParam)}&travelmode=driving`;

    Linking.openURL(mapsUrl).catch(() => {
      Alert.alert("Navigation Launch Error", "Unable to launch Google Maps application.");
    });
  };

  const handleStartTrip = () => {
    if (navState === "IDLE") {
      setNavState("EN_ROUTE_PICKUP");
      handleOpenExternalNavigation();
      Alert.alert(
        "Navigation Started",
        `En route to pickup location:\n${pickup.name}\n\nRedirecting to Google Maps turn-by-turn navigation.`
      );
    } else if (navState === "EN_ROUTE_PICKUP") {
      setNavState("EN_ROUTE_DEST");
      handleOpenExternalNavigation();
      Alert.alert(
        "Arrived at Pickup",
        `Cargo loaded. Now navigating to destination:\n${destination.name}\n\nRedirecting to Google Maps.`
      );
    } else if (navState === "EN_ROUTE_DEST") {
      setNavState("COMPLETED");
      Alert.alert("Trip Completed", `Delivery completed at ${destination.name}!`);
    } else {
      setNavState("IDLE");
    }
  };

  // If NOT a driver, render access restriction screen
  if (!isDriver) {
    return (
      <ScreenWrapper title="Driver Navigation">
        <View style={styles.accessDeniedContainer}>
          <View style={styles.accessDeniedCard}>
            <View style={styles.accessIconContainer}>
              <Text style={styles.accessIcon}>🛡️</Text>
            </View>
            <Text style={styles.accessDeniedTitle}>Driver Only Facility</Text>
            <Text style={styles.accessDeniedBadge}>RESTRICTED MODULE</Text>
            <Text style={styles.accessDeniedBody}>
              The interactive Navigation and Pickup/Destination dispatch tool is restricted exclusively to{" "}
              <Text style={styles.boldText}>Drivers (ROLE_DRIVER)</Text>.
            </Text>
            <Text style={styles.accessRoleSubtext}>
              Your active role: <Text style={styles.userRoleTag}>{user?.role || "UNKNOWN_ROLE"}</Text>
            </Text>

            <View style={styles.accessActionRow}>
              <TouchableOpacity
                style={styles.demoOverrideButton}
                onPress={() => setDemoDriverAccess(true)}
              >
                <Text style={styles.demoOverrideText}>🔓 Enable Driver Preview Mode</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backDashboardButton}
                onPress={() => navigation.navigate("Dashboard")}
              >
                <Text style={styles.backDashboardText}>Return to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Driver Navigation">
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* Top Header Card with Driver Role Indicator */}
        <View style={styles.headerBanner}>
          <View style={styles.driverBadgeRow}>
            <Text style={styles.driverBadgeIcon}>🚛</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverBadgeTitle}>Driver Navigation Console</Text>
              <Text style={styles.driverBadgeSubtitle}>Driver Authorized Access • Active Session</Text>
            </View>
          </View>
          {demoDriverAccess && (
            <View style={styles.demoBannerTag}>
              <Text style={styles.demoBannerText}>PREVIEW MODE ACTIVE</Text>
            </View>
          )}
        </View>

        {/* Pickup & Destination Controls */}
        <View style={styles.inputsCard}>
          <Text style={styles.sectionHeading}>Route Setup</Text>

          {/* Pickup Input Row */}
          <View style={styles.inputGroup}>
            <View style={styles.locationLabelRow}>
              <Text style={[styles.locationDot, { color: "#10B981" }]}>🟢</Text>
              <Text style={styles.inputLabel}>Pickup Location</Text>
            </View>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setShowPickupPresets(!showPickupPresets);
                setShowDestPresets(false);
              }}
            >
              <TextInput
                style={styles.textInput}
                value={pickupInput}
                onChangeText={setPickupInput}
                placeholder="Enter pickup address or choose preset..."
                placeholderTextColor={authColors.neutral400}
                editable={true}
              />
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>

            {/* Pickup Presets Dropdown */}
            {showPickupPresets && (
              <View style={styles.presetDropdown}>
                <Text style={styles.presetHeader}>Select Preset Pickup Location:</Text>
                {PRESET_LOCATIONS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.presetItem}
                    onPress={() => handleSelectPickup(item)}
                  >
                    <Text style={styles.presetName}>{item.name}</Text>
                    <Text style={styles.presetAddress}>{item.address}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Swap Button */}
          <TouchableOpacity style={styles.swapButton} onPress={handleSwapLocations}>
            <Text style={styles.swapIcon}>⇅</Text>
            <Text style={styles.swapText}>Swap Pickup & Destination</Text>
          </TouchableOpacity>

          {/* Destination Input Row */}
          <View style={styles.inputGroup}>
            <View style={styles.locationLabelRow}>
              <Text style={[styles.locationDot, { color: "#EF4444" }]}>🔴</Text>
              <Text style={styles.inputLabel}>Destination Location</Text>
            </View>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setShowDestPresets(!showDestPresets);
                setShowPickupPresets(false);
              }}
            >
              <TextInput
                style={styles.textInput}
                value={destInput}
                onChangeText={setDestInput}
                placeholder="Enter destination address or choose preset..."
                placeholderTextColor={authColors.neutral400}
                editable={true}
              />
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>

            {/* Destination Presets Dropdown */}
            {showDestPresets && (
              <View style={styles.presetDropdown}>
                <Text style={styles.presetHeader}>Select Preset Destination Location:</Text>
                {PRESET_LOCATIONS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.presetItem}
                    onPress={() => handleSelectDestination(item)}
                  >
                    <Text style={styles.presetName}>{item.name}</Text>
                    <Text style={styles.presetAddress}>{item.address}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Map Container View */}
        <View style={styles.mapCard}>
          <View style={styles.mapHeaderRow}>
            <Text style={styles.mapTitle}>Live Navigation Map</Text>
            <TouchableOpacity style={styles.recenterButton} onPress={handleFitRoute}>
              <Text style={styles.recenterText}>🎯 Fit Route</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapWrapper}>
            <MapErrorBoundary
              fallback={
                <View style={styles.vectorMapCanvas}>
                  <View style={styles.gridOverlay}>
                    {/* Route Connection Vector Line */}
                    <View style={styles.vectorLineContainer}>
                      <View style={styles.vectorDashedLine} />
                    </View>

                    {/* Pickup Pin */}
                    <View style={styles.vectorPinPickup}>
                      <View style={styles.pinBadgePickup}>
                        <Text style={styles.pinText}>🟢 PICKUP</Text>
                      </View>
                      <Text style={styles.pinName} numberOfLines={1}>{pickup.name}</Text>
                      <Text style={styles.pinCoords}>{pickup.latitude.toFixed(4)}, {pickup.longitude.toFixed(4)}</Text>
                    </View>

                    {/* Destination Pin */}
                    <View style={styles.vectorPinDest}>
                      <View style={styles.pinBadgeDest}>
                        <Text style={styles.pinText}>🔴 DESTINATION</Text>
                      </View>
                      <Text style={styles.pinName} numberOfLines={1}>{destination.name}</Text>
                      <Text style={styles.pinCoords}>{destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}</Text>
                    </View>
                  </View>

                  <View style={styles.nativeMapNotice}>
                    <Text style={styles.nativeMapNoticeText}>
                      💡 Driver Navigation Console • Interactive Route Preview Active
                    </Text>
                  </View>
                </View>
              }
            >
              {isMapLibreLinked && MapLibreGL ? (
                <MapLibreGL.MapView
                  style={styles.map}
                  styleURL={MapLibreGL.StyleURL?.Default || "https://demotiles.maplibre.org/style.json"}
                  logoEnabled={false}
                  attributionEnabled={true}
                >
                  <MapLibreGL.Camera
                    ref={cameraRef}
                    centerCoordinate={[
                      (pickup.longitude + destination.longitude) / 2,
                      (pickup.latitude + destination.latitude) / 2,
                    ]}
                    zoomLevel={12}
                    animationDuration={500}
                  />
                  <MapLibreGL.PointAnnotation
                    id="pickupMarker"
                    coordinate={[pickup.longitude, pickup.latitude]}
                    title={pickup.name}
                  >
                    <View style={styles.mapLibrePinPickup}>
                      <Text style={styles.mapLibrePinText}>🟢</Text>
                    </View>
                  </MapLibreGL.PointAnnotation>

                  <MapLibreGL.PointAnnotation
                    id="destMarker"
                    coordinate={[destination.longitude, destination.latitude]}
                    title={destination.name}
                  >
                    <View style={styles.mapLibrePinDest}>
                      <Text style={styles.mapLibrePinText}>🔴</Text>
                    </View>
                  </MapLibreGL.PointAnnotation>

                  <MapLibreGL.ShapeSource id="routeSource" shape={routeGeoJson}>
                    <MapLibreGL.LineLayer
                      id="routeLine"
                      style={{
                        lineColor: "#2563EB",
                        lineWidth: 4,
                        lineCap: "round",
                        lineJoin: "round",
                      }}
                    />
                  </MapLibreGL.ShapeSource>
                </MapLibreGL.MapView>
              ) : (
                /* Fallback Interactive Route Grid Canvas when Native Map binary is rebuilding */
                <View style={styles.vectorMapCanvas}>
                  <View style={styles.gridOverlay}>
                    {/* Route Connection Vector Line */}
                    <View style={styles.vectorLineContainer}>
                      <View style={styles.vectorDashedLine} />
                    </View>

                    {/* Pickup Pin */}
                    <View style={styles.vectorPinPickup}>
                      <View style={styles.pinBadgePickup}>
                        <Text style={styles.pinText}>🟢 PICKUP</Text>
                      </View>
                      <Text style={styles.pinName} numberOfLines={1}>{pickup.name}</Text>
                      <Text style={styles.pinCoords}>{pickup.latitude.toFixed(4)}, {pickup.longitude.toFixed(4)}</Text>
                    </View>

                    {/* Destination Pin */}
                    <View style={styles.vectorPinDest}>
                      <View style={styles.pinBadgeDest}>
                        <Text style={styles.pinText}>🔴 DESTINATION</Text>
                      </View>
                      <Text style={styles.pinName} numberOfLines={1}>{destination.name}</Text>
                      <Text style={styles.pinCoords}>{destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}</Text>
                    </View>
                  </View>

                  <View style={styles.nativeMapNotice}>
                    <Text style={styles.nativeMapNoticeText}>
                      💡 Interactive Dynamic Route Mode • React-Native-Maps module added to package.json
                    </Text>
                  </View>
                </View>
              )}
            </MapErrorBoundary>
          </View>
        </View>

        {/* Route Details Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryStatsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Est. Distance</Text>
              <Text style={styles.statValue}>{estimatedKm} km</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Est. Travel Time</Text>
              <Text style={styles.statValue}>{estimatedTimeMins} mins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Traffic Status</Text>
              <Text style={[styles.statValue, { color: "#10B981" }]}>Clear 🟢</Text>
            </View>
          </View>

          {/* Navigation Action CTA */}
          <TouchableOpacity
            style={[
              styles.navActionButton,
              navState === "EN_ROUTE_PICKUP" && { backgroundColor: "#D97706" },
              navState === "EN_ROUTE_DEST" && { backgroundColor: "#10B981" },
              navState === "COMPLETED" && { backgroundColor: "#475569" },
            ]}
            onPress={handleStartTrip}
          >
            <Text style={styles.navActionText}>
              {navState === "IDLE" && "🚀 Start Route Navigation"}
              {navState === "EN_ROUTE_PICKUP" && "📍 Arrived at Pickup Point"}
              {navState === "EN_ROUTE_DEST" && "🏁 Complete Delivery"}
              {navState === "COMPLETED" && "🔄 Reset Trip Status"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleMapsButton}
            onPress={handleOpenExternalNavigation}
          >
            <Text style={styles.googleMapsButtonText}>🗺️ Open in Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Turn-by-Turn Guidance Steps */}
        <View style={styles.directionsCard}>
          <Text style={styles.sectionHeading}>Turn-by-Turn Instructions</Text>
          <View style={styles.stepRow}>
            <Text style={styles.stepNum}>1</Text>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>Depart from {pickup.name}</Text>
              <Text style={styles.stepDetail}>Head North toward Main Express Route (0.4 km)</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNum}>2</Text>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>Merge onto Transit Expressway</Text>
              <Text style={styles.stepDetail}>Continue straight for {Math.round(parseFloat(estimatedKm) * 0.7)} km</Text>
            </View>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNum}>3</Text>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>Take Exit 14 toward {destination.name}</Text>
              <Text style={styles.stepDetail}>Arrive at destination gate (0.8 km)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: authColors.pageBg,
  },
  headerBanner: {
    backgroundColor: authColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  driverBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverBadgeIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  driverBadgeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  driverBadgeSubtitle: {
    fontSize: 12,
    color: authColors.textMuted,
    marginTop: 2,
  },
  demoBannerTag: {
    marginTop: 10,
    backgroundColor: "#FEF3C7",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  demoBannerText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
  },
  inputsCard: {
    backgroundColor: authColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: authColors.textPrimary,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  locationLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationDot: {
    fontSize: 12,
    marginRight: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: authColors.textSecondary,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: authColors.textPrimary,
  },
  chevron: {
    fontSize: 10,
    color: authColors.neutral500,
    marginLeft: 8,
  },
  presetDropdown: {
    marginTop: 6,
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    zIndex: 10,
  },
  presetHeader: {
    fontSize: 11,
    fontWeight: "600",
    color: authColors.neutral500,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  presetItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: authColors.cardBorder,
  },
  presetName: {
    fontSize: 13,
    fontWeight: "600",
    color: authColors.textPrimary,
  },
  presetAddress: {
    fontSize: 11,
    color: authColors.textMuted,
    marginTop: 2,
  },
  swapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    marginBottom: 12,
    backgroundColor: authColors.roleActiveBg,
    borderRadius: 6,
  },
  swapIcon: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.roleAccent,
    marginRight: 6,
  },
  swapText: {
    fontSize: 12,
    fontWeight: "600",
    color: authColors.roleAccent,
  },
  mapCard: {
    backgroundColor: authColors.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  mapHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  recenterButton: {
    backgroundColor: authColors.roleActiveBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  recenterText: {
    fontSize: 12,
    fontWeight: "600",
    color: authColors.roleAccent,
  },
  mapWrapper: {
    height: 250,
    borderRadius: 8,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  vectorMapCanvas: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 8,
    padding: 16,
    justifyContent: "space-between",
  },
  gridOverlay: {
    flex: 1,
    position: "relative",
    justifyContent: "space-between",
  },
  vectorLineContainer: {
    position: "absolute",
    top: 30,
    bottom: 30,
    left: 40,
    width: 2,
    backgroundColor: "rgba(37, 99, 235, 0.4)",
    justifyContent: "center",
  },
  vectorDashedLine: {
    height: "100%",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  vectorPinPickup: {
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#10B981",
    maxWidth: "85%",
    alignSelf: "flex-start",
  },
  vectorPinDest: {
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#EF4444",
    maxWidth: "85%",
    alignSelf: "flex-end",
  },
  pinBadgePickup: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  pinBadgeDest: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  pinText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pinName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  pinCoords: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  nativeMapNotice: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  nativeMapNoticeText: {
    fontSize: 10,
    color: "#CBD5E1",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: authColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  summaryStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: authColors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: authColors.cardBorder,
  },
  navActionButton: {
    backgroundColor: authColors.roleAccent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  navActionText: {
    color: authColors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  directionsCard: {
    backgroundColor: authColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: authColors.roleActiveBg,
    color: authColors.roleAccent,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 12,
    marginRight: 10,
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: authColors.textPrimary,
  },
  stepDetail: {
    fontSize: 12,
    color: authColors.textMuted,
    marginTop: 2,
  },

  // Access Denied styles
  accessDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: authColors.pageBg,
  },
  accessDeniedCard: {
    width: "100%",
    backgroundColor: authColors.cardBg,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: authColors.cardBorder,
  },
  accessIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: authColors.errorBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  accessIcon: {
    fontSize: 32,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: authColors.textPrimary,
    marginBottom: 4,
  },
  accessDeniedBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: authColors.error,
    backgroundColor: authColors.errorBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 16,
    letterSpacing: 1,
  },
  accessDeniedBody: {
    fontSize: 14,
    color: authColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: "700",
    color: authColors.textPrimary,
  },
  accessRoleSubtext: {
    fontSize: 12,
    color: authColors.textMuted,
    marginBottom: 24,
  },
  userRoleTag: {
    fontWeight: "700",
    color: authColors.roleAccent,
  },
  accessActionRow: {
    width: "100%",
    gap: 10,
  },
  demoOverrideButton: {
    backgroundColor: authColors.roleActiveBg,
    borderWidth: 1,
    borderColor: authColors.roleActiveBorder,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  demoOverrideText: {
    color: authColors.roleAccent,
    fontSize: 14,
    fontWeight: "700",
  },
  backDashboardButton: {
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  backDashboardText: {
    color: authColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  mapLibrePinPickup: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#10B981",
  },
  mapLibrePinDest: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#EF4444",
  },
  mapLibrePinText: {
    fontSize: 16,
  },
  googleMapsButton: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  googleMapsButtonText: {
    color: "#38BDF8",
    fontSize: 15,
    fontWeight: "700",
  },
});
