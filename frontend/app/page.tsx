import { MockLocationTrigger } from "@/components/dev/MockLocationTrigger";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <h1 className="mb-2 text-4xl font-bold text-heritage-earth">
          Adwa AI Companion
        </h1>
        <p className="mb-8 text-heritage-stone">
          Voice-first &amp; WebXR AR tour guide OS
        </p>
        <p className="text-sm text-heritage-stone/70">
          Hackathon scaffold ready — implement features during the event.
        </p>
      </div>
      <MockLocationTrigger />
    </main>
  );
}
