"use client";
import { useEffect, useRef } from "react";
import { auth } from "../firebase";
import * as firebaseui from "firebaseui";
import "firebaseui/dist/firebaseui.css"; // 🔥 Required CSS

let ui: firebaseui.auth.AuthUI | null = null;

const FirebaseAuthUI = () => {
    const uiRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!uiRef.current) return;

        if (!ui) {
            ui = new firebaseui.auth.AuthUI(auth);
        } else {
            ui.reset();
        }

        ui.start(uiRef.current, {
            signInOptions: [
                // Choose your providers:
                {
                    provider: "google.com",
                },
                {
                    provider: "password", // email/password
                    customParameters: {
                        theme: "dark", // Set dark theme
                    },
                },
            ],
            signInSuccessUrl: "../", // Redirect after login
        });
    }, []);

    return <div ref={uiRef} />;
};

export default FirebaseAuthUI;
