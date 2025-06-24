import ChatInput from "@/components/chat_input";
import { Main } from "next/document";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center max-x-3xl px-8 min-h-screen text-white">
      <div className="flex flex-col w-full mx-auto text-center p-4 gap-5">
        <h2 className="md:text-2xl font-semibold">
          Start infinite Learning by Asking
        </h2>
        <ChatInput />
      </div>
    </main>
  );
}
