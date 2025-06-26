import FirebaseAuthUI from "@/components/firebase-auth-ui";

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="max-w-md w-full p-6 shadow-lg rounded-lg bg-white">
            <h1 className="text-center mb-6 text-2xl text-black">Sign In</h1>
            <FirebaseAuthUI />
            </div>
        </div>
    );
}