// components/ToggleSection.jsx
"use client"

import * as React from "react"
import { Switch } from "@/components/ui/switch"

interface ToggleProps {
    label: React.ReactNode;
    children?: React.ReactNode;
}

export default function Toggle({ label, children }: ToggleProps) {
    const [isToggled, setIsToggled] = React.useState(false)
    const id = React.useId() // Generates a unique ID for accessibility

    return (
        <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
                <Switch
                    id={id}
                    checked={isToggled}
                    onCheckedChange={setIsToggled}
                />
                <label
                    htmlFor={id}
                    className="text-base font-medium leading-none"
                >
                    {label}
                </label>
            </div>

            {/* Conditionally render children when the toggle is on */}
            {isToggled && (
                <div className="pt-4 mt-4 border-t">
                    {children}
                </div>
            )}
        </div>
    )
}