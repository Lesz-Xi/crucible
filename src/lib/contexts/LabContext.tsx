"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import { ExperimentRecord } from "../services/scientific-provenance";

// ── Types ────────────────────────────────────────────────────────

type ToolName = "fetch_structure" | "analyze_sequence" | "dock_ligand" | null;

interface LabState {
    isOffline: boolean;
    activeTool: ToolName;
    currentStructure: {
        pdbId: string;
        content: string;
        metadata?: any;
    } | null;
    experimentHistory: ExperimentRecord[];
    isSidebarOpen: boolean;
}

type LabAction =
    | { type: "SET_OFFLINE"; payload: boolean }
    | { type: "SET_ACTIVE_TOOL"; payload: ToolName }
    | { type: "LOAD_STRUCTURE"; payload: { pdbId: string; content: string; metadata?: any } }
    | { type: "ADD_EXPERIMENT"; payload: ExperimentRecord }
    | { type: "TOGGLE_SIDEBAR" };

// ── Initial State ────────────────────────────────────────────────

const initialState: LabState = {
    isOffline: false,
    activeTool: null,
    currentStructure: null,
    experimentHistory: [],
    isSidebarOpen: true,
};

// ── Reducer ──────────────────────────────────────────────────────

function labReducer(state: LabState, action: LabAction): LabState {
    switch (action.type) {
        case "SET_OFFLINE":
            return { ...state, isOffline: action.payload };
        case "SET_ACTIVE_TOOL":
            return { ...state, activeTool: action.payload };
        case "LOAD_STRUCTURE":
            return { ...state, currentStructure: action.payload };
        case "ADD_EXPERIMENT":
            return { ...state, experimentHistory: [action.payload, ...state.experimentHistory] };
        case "TOGGLE_SIDEBAR":
            return { ...state, isSidebarOpen: !state.isSidebarOpen };
        default:
            return state;
    }
}

// ── Context ──────────────────────────────────────────────────────

const LabContext = createContext<{
    state: LabState;
    dispatch: React.Dispatch<LabAction>;
} | undefined>(undefined);

export function LabProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(labReducer, initialState);

    // Offline Detection
    useEffect(() => {
        const handleOnline = () => dispatch({ type: "SET_OFFLINE", payload: false });
        const handleOffline = () => dispatch({ type: "SET_OFFLINE", payload: true });

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <LabContext.Provider value={{ state, dispatch }}>
            {children}
        </LabContext.Provider>
    );
}

export function useLab() {
    const context = useContext(LabContext);
    if (context === undefined) {
        throw new Error("useLab must be used within a LabProvider");
    }
    return context;
}
