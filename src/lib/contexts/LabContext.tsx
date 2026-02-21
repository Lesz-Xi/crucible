"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  LabExperiment,
  LabState,
  LabAction,
  LabToolId,
  LabError,
  LabErrorCode,
  LabToolInput,
  LabToolResult,
  ProteinStructure,
  LLMConfig,
} from "../../types/lab";
import { LabPersistenceService } from "../services/lab-persistence";
import { getCurrentUser } from "../auth/actions";

// =============================================================
// LabContext - State Management for Bio-Computation Lab
// Phase 1 - Production Foundation with Persistence
// =============================================================

// Extended context value with persistence methods
interface LabContextValue {
  state: LabState;
  dispatch: React.Dispatch<LabAction>;
  // Persistence methods
  createExperiment: (
    toolName: LabExperiment['tool_name'],
    input: LabToolInput,
    causalRole: LabExperiment['causal_role']
  ) => Promise<LabExperiment | null>;
  updateExperimentResult: (
    id: string,
    result: LabToolResult,
    status: LabExperiment['status']
  ) => Promise<boolean>;
  loadExperimentHistory: () => Promise<void>;
  removeExperiment: (id: string) => Promise<boolean>;
  // LLM Config methods
  setLLMConfig: (config: Partial<LLMConfig>) => void;
  setModelSettingsOpen: (open: boolean) => void;
  // Utility
  isReady: boolean;
  userId: string | null;
}

// Default LLM Config (Feb 2026 - Harmonized with AI_CONFIG)
const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'anthropic',
  model: 'claude-4-5-sonnet', // Updated to standard identifier
  temperature: 0.7,
};

// Initial state
const initialState: LabState = {
  isOffline: !navigator.onLine,
  isLoading: false,
  activeTool: null,
  activePanel: null,
  currentStructure: null,
  experimentHistory: [],
  isSidebarOpen: true,
  isNotebookExpanded: false,
  lastError: null,
  llmConfig: DEFAULT_LLM_CONFIG,
  isModelSettingsOpen: false,
};

// Reducer
function labReducer(state: LabState, action: LabAction): LabState {
  switch (action.type) {
    case "SET_OFFLINE":
      return { ...state, isOffline: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ACTIVE_TOOL":
      return { ...state, activeTool: action.payload };
    case "SET_ACTIVE_PANEL":
      return { ...state, activePanel: action.payload };
    case "LOAD_STRUCTURE":
      return { ...state, currentStructure: action.payload };
    case "ADD_EXPERIMENT":
      return {
        ...state,
        experimentHistory: [action.payload, ...state.experimentHistory],
      };
    case "UPDATE_EXPERIMENT": {
      const { id, updates } = action.payload;
      return {
        ...state,
        experimentHistory: state.experimentHistory.map((exp) =>
          exp.id === id ? { ...exp, ...updates } : exp
        ),
      };
    }
    case "SET_EXPERIMENT_HISTORY":
      return { ...state, experimentHistory: action.payload };
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case "TOGGLE_NOTEBOOK":
      return { ...state, isNotebookExpanded: !state.isNotebookExpanded };
    case "SET_ERROR":
      return { ...state, lastError: action.payload };
    case "CLEAR_ERROR":
      return { ...state, lastError: null };
    case "SET_LLM_CONFIG":
      return { ...state, llmConfig: { ...state.llmConfig, ...action.payload } };
    case "SET_MODEL_SETTINGS_OPEN":
      return { ...state, isModelSettingsOpen: action.payload };
    default:
      return state;
  }
}

// Context
const LabContext = createContext<LabContextValue | undefined>(undefined);

export function LabProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(labReducer, initialState);
  const [isReady, setIsReady] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const isInitializedRef = useRef(false);
  const persistenceRef = useRef<LabPersistenceService | null>(null);

  // Initialize: get user and load experiments
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const initialize = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });

        // Get persistence service instance
        persistenceRef.current = LabPersistenceService.getInstance();

        // Get current user
        const user = await getCurrentUser();
        setUserId(user?.id ?? null);

        // Load experiments if user is authenticated
        if (user?.id && persistenceRef.current) {
          const result = await persistenceRef.current.getExperiments();
          if (result.success && result.data) {
            dispatch({ type: "SET_EXPERIMENT_HISTORY", payload: result.data });
          }
        }

        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize lab context:", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            code: LabErrorCode.INITIALIZATION_FAILED,
            message: "Failed to initialize lab environment",
            timestamp: new Date().toISOString(),
            recoverable: true,
          },
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initialize();
  }, []);

  // Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: "SET_OFFLINE", payload: false });
      // Sync offline queue when coming back online
      persistenceRef.current?.syncOfflineQueue().catch(console.error);
    };
    const handleOffline = () => {
      dispatch({ type: "SET_OFFLINE", payload: true });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Persistence Methods

  const createExperiment = useCallback(
    async (
      toolName: LabExperiment["tool_name"],
      input: LabToolInput,
      causalRole: LabExperiment["causal_role"]
    ): Promise<LabExperiment | null> => {
      if (!persistenceRef.current) {
        dispatch({
          type: "SET_ERROR",
          payload: {
            code: LabErrorCode.UNAUTHORIZED,
            message: "Lab environment not initialized",
            timestamp: new Date().toISOString(),
            recoverable: false,
          },
        });
        return null;
      }

      try {
        const result = await persistenceRef.current.createExperiment(
          toolName,
          causalRole,
          input
        );

        if (result.success && result.data) {
          dispatch({ type: "ADD_EXPERIMENT", payload: result.data });
          return result.data;
        }

        return null;
      } catch (error) {
        console.error("Failed to create experiment:", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            code: LabErrorCode.SAVE_FAILED,
            message: "Failed to create experiment",
            timestamp: new Date().toISOString(),
            recoverable: true,
          },
        });
        return null;
      }
    },
    []
  );

  const updateExperimentResult = useCallback(
    async (
      id: string,
      result: LabToolResult,
      status: LabExperiment["status"]
    ): Promise<boolean> => {
      if (!persistenceRef.current) return false;

      try {
        const updateResult = await persistenceRef.current.updateExperiment(id, {
          result_json: result,
          status,
        });

        if (updateResult.success) {
          dispatch({
            type: "UPDATE_EXPERIMENT",
            payload: { id, updates: { result_json: result, status } },
          });
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to update experiment:", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            code: LabErrorCode.SAVE_FAILED,
            message: "Failed to update experiment",
            timestamp: new Date().toISOString(),
            recoverable: true,
          },
        });
        return false;
      }
    },
    []
  );

  const loadExperimentHistory = useCallback(async () => {
    if (!persistenceRef.current) return;

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const result = await persistenceRef.current.getExperiments();
      if (result.success && result.data) {
        dispatch({ type: "SET_EXPERIMENT_HISTORY", payload: result.data });
      }
    } catch (error) {
      console.error("Failed to load experiments:", error);
      dispatch({
        type: "SET_ERROR",
        payload: {
          code: LabErrorCode.LOAD_FAILED,
          message: "Failed to load experiment history",
          timestamp: new Date().toISOString(),
          recoverable: true,
        },
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const removeExperiment = useCallback(
    async (id: string): Promise<boolean> => {
      if (!persistenceRef.current) return false;

      try {
        const result = await persistenceRef.current.deleteExperiment(id);
        if (result.success) {
          // Remove from local state
          dispatch({
            type: "SET_EXPERIMENT_HISTORY",
            payload: state.experimentHistory.filter((exp) => exp.id !== id),
          });
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to delete experiment:", error);
        dispatch({
          type: "SET_ERROR",
          payload: {
            code: LabErrorCode.DELETE_FAILED,
            message: "Failed to delete experiment",
            timestamp: new Date().toISOString(),
            recoverable: true,
          },
        });
        return false;
      }
    },
    [state.experimentHistory]
  );

  // LLM Config Methods

  const setLLMConfig = useCallback((config: Partial<LLMConfig>) => {
    dispatch({ type: "SET_LLM_CONFIG", payload: config });
  }, []);

  const setModelSettingsOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_MODEL_SETTINGS_OPEN", payload: open });
  }, []);

  // Context Value
  const value: LabContextValue = {
    state,
    dispatch,
    createExperiment,
    updateExperimentResult,
    loadExperimentHistory,
    removeExperiment,
    setLLMConfig,
    setModelSettingsOpen,
    isReady,
    userId,
  };

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export function useLab() {
  const context = useContext(LabContext);
  if (context === undefined) {
    // Return a dummy context to avoid crashing statically generated pages
    return {
      state: initialState,
      dispatch: () => {},
      createExperiment: async () => null,
      updateExperimentResult: async () => false,
      loadExperimentHistory: async () => {},
      removeExperiment: async () => false,
      setLLMConfig: () => {},
      setModelSettingsOpen: () => {},
      isReady: false,
      userId: null,
    };
  }
  return context;
}

export function useOptionalLab() {
  return useContext(LabContext);
}

// =============================================================
// Utility Hooks
// =============================================================

/**
 * Hook for tool execution with automatic experiment recording
 */
export function useLabTool(toolId: LabToolId) {
  const {
    state,
    createExperiment,
    updateExperimentResult,
    isReady,
    userId,
    dispatch,
  } = useLab();
  const [isExecuting, setIsExecuting] = React.useState(false);

  const execute = useCallback(
    async <T extends LabToolInput, R extends LabToolResult>(
      input: T,
      causalRole: LabExperiment["causal_role"],
      executeFn: () => Promise<R>
    ): Promise<R | null> => {
      if (!isReady || !userId) {
        dispatch({
          type: "SET_ERROR",
          payload: {
            code: LabErrorCode.NOT_INITIALIZED,
            message: "Lab environment not ready. Please wait or sign in.",
            timestamp: new Date().toISOString(),
            recoverable: true,
          },
        });
        return null;
      }

      setIsExecuting(true);

      // Create experiment record
      const experiment = await createExperiment(
        toolId as LabExperiment["tool_name"],
        input,
        causalRole
      );

      if (!experiment) {
        setIsExecuting(false);
        return null;
      }

      try {
        const result = await executeFn();

        // Update experiment with success
        await updateExperimentResult(experiment.id, result, "success");

        return result;
      } catch (error) {
        // Update experiment with failure
        const errorMessage =
          error instanceof Error ? error.message : "Tool execution failed";
        await updateExperimentResult(
          experiment.id,
          { error: errorMessage } as unknown as R,
          "failure"
        );

        dispatch({
          type: "SET_ERROR",
          payload: {
            code: LabErrorCode.EXECUTION_FAILED,
            message: errorMessage,
            timestamp: new Date().toISOString(),
            recoverable: true,
          },
        });

        return null;
      } finally {
        setIsExecuting(false);
      }
    },
    [toolId, isReady, userId, createExperiment, updateExperimentResult, dispatch]
  );

  return {
    execute,
    isExecuting,
    isOffline: state.isOffline,
    isReady,
  };
}

/**
 * Hook for accessing current structure
 */
export function useCurrentStructure() {
  const { state, dispatch } = useLab();

  const loadStructure = useCallback(
    (
      pdbId: string,
      content: string,
      metadata?: ProteinStructure["metadata"]
    ) => {
      dispatch({
        type: "LOAD_STRUCTURE",
        payload: {
          pdbId,
          content,
          metadata,
          loadedAt: new Date().toISOString(),
        },
      });
    },
    [dispatch]
  );

  const clearStructure = useCallback(() => {
    dispatch({ type: "LOAD_STRUCTURE", payload: null });
  }, [dispatch]);

  return {
    structure: state.currentStructure,
    loadStructure,
    clearStructure,
  };
}

/**
 * Hook for experiment history
 */
export function useExperimentHistory() {
  const { state, loadExperimentHistory, removeExperiment, isReady } = useLab();

  return {
    experiments: state.experimentHistory,
    isLoading: state.isLoading,
    isReady,
    refresh: loadExperimentHistory,
    removeExperiment,
  };
}

/**
 * Hook for lab error handling
 */
export function useLabError() {
  const { state, dispatch } = useLab();

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, [dispatch]);

  const setError = useCallback(
    (code: LabErrorCode, message: string, recoverable = true) => {
      dispatch({
        type: "SET_ERROR",
        payload: {
          code,
          message,
          timestamp: new Date().toISOString(),
          recoverable,
        },
      });
    },
    [dispatch]
  );

  return {
    error: state.lastError,
    clearError,
    setError,
  };
}
