import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#3d3a2f" },
          headerTintColor: "#f5f1e6",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "RangerVault",
            // National-park green, matching the "Identify Wildlife" button
            // — distinct from the other screens' shared dark header.
            headerStyle: { backgroundColor: "#5b6b3f" },
          }}
        />
        {/* Vault title + header color are set per park inside the screen. */}
        <Stack.Screen name="park/[parkId]/index" options={{ title: "" }} />
        <Stack.Screen name="park/[parkId]/species/[id]" options={{ title: "" }} />
        <Stack.Screen name="camera" options={{ title: "Identify Wildlife" }} />
        <Stack.Screen name="profile" options={{ title: "Ranger Profile" }} />
      </Stack>
    </>
  );
}
