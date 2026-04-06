import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { handleCallback } from "~/lib/auth";

export default function Callback() {
  const navigate = useNavigate();

  onMount(async () => {
    try {
      await handleCallback();
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[auth] Callback error:", err);
      navigate("/login", { replace: true });
    }
  });

  return (
    <main class="flex items-center justify-center min-h-screen">
      <p class="text-gray-500">Autenticando...</p>
    </main>
  );
}
