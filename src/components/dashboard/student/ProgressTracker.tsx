import { motion } from "framer-motion";

interface Step {
  label: string;
  detail?: string;
}

interface ProgressTrackerProps {
  steps: Step[];
  currentStep: number;
  status: "Approved" | "Pending" | "Rejected";
  showDetails?: boolean;
}

const ProgressTracker = ({ steps, currentStep, status, showDetails = false }: ProgressTrackerProps) => {
  const totalSteps = steps.length;

  return (
    <div className="relative flex items-start justify-between px-2 py-2">
      {/* Background line */}
      <div className="absolute left-[calc(12.5%)] right-[calc(12.5%)] top-[18px] h-[3px] rounded-full bg-border" />

      {/* Progress line */}
      <div
        className={`absolute left-[calc(12.5%)] top-[18px] h-[3px] rounded-full transition-all duration-700 ease-out ${
          status === "Rejected" ? "bg-status-rejected" : "bg-primary"
        }`}
        style={{
          width: currentStep === 0
            ? "0%"
            : `calc(${(currentStep / (totalSteps - 1)) * 75}%)`,
        }}
      />

      {steps.map((step, si) => {
        const isCompleted = si < currentStep;
        const isCurrent = si === currentStep;
        const isRejected = status === "Rejected" && isCurrent;
        const isPending = status === "Pending" && isCurrent;
        const isActive = isCompleted || isCurrent;

        return (
          <div
            key={step.label}
            className="relative z-10 flex flex-col items-center"
            style={{ width: `${100 / totalSteps}%` }}
          >
            {/* Node */}
            <div className="relative">
              {/* Pulse ring for current pending step */}
              {isPending && (
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping-slow" />
              )}

              <div
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border-[3px] transition-all duration-300 ${
                  isRejected
                    ? "border-status-rejected bg-status-rejected/15"
                    : isCompleted
                      ? "border-primary bg-primary shadow-sm shadow-primary/20"
                      : isPending
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                }`}
              >
                {/* Completed checkmark */}
                {isCompleted && !isRejected && (
                  <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}

                {/* Current pending dot */}
                {isPending && (
                  <div className="h-3 w-3 rounded-full bg-primary" />
                )}

                {/* Rejected X */}
                {isRejected && (
                  <svg className="h-4 w-4 text-status-rejected" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}

                {/* Completed with approval (non-pending current) */}
                {isCurrent && status === "Approved" && (
                  <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}

                {/* Future step number */}
                {!isActive && (
                  <span className="text-[11px] font-semibold text-muted-foreground">{si + 1}</span>
                )}
              </div>
            </div>

            {/* Label */}
            <span
              className={`mt-2.5 text-[11px] font-semibold text-center leading-tight ${
                isRejected
                  ? "text-status-rejected"
                  : isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>

            {/* Detail text */}
            {showDetails && step.detail && (
              <span className="mt-0.5 text-[10px] text-muted-foreground text-center max-w-[100px] leading-tight">
                {step.detail}
              </span>
            )}

            {/* In progress indicator */}
            {isPending && (
              <motion.span
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                In Progress
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressTracker;
