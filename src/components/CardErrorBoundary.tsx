import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Contains a render error to one card instead of the whole app.
 *
 * The app had no error boundary at all, so any exception thrown during render
 * propagated to the root and React unmounted the entire tree — a single malformed
 * metric card from the assistant turned the screen blank. A blank screen in front of a
 * client is a far worse outcome than one card that says it could not be drawn, and the
 * chat renders whatever the model returns, so this surface will always be the least
 * predictable one in the app.
 *
 * Scoped deliberately to the card, not the page: wrapping something larger would hide
 * failures in the chat transcript itself, and the point is to lose as little of the view
 * as possible.
 *
 * This is containment, not a fix. `src/lib/metricCard.ts` validates cards at the
 * boundary so they do not throw in the first place; this is what catches the case we
 * did not anticipate.
 */

interface Props {
  children: React.ReactNode;
  /** Shown in the console alongside the error, to identify which surface failed. */
  label?: string;
}

interface State {
  error: Error | null;
}

export class CardErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep the full detail in the console — swallowing it entirely would trade a
    // visible crash for an invisible one, which is how a bug like this survives.
    console.error(
      `[CardErrorBoundary] ${this.props.label ?? 'card'} failed to render:`,
      error,
      info.componentStack,
    );
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="p-4 rounded-lg border border-amber-300/30 bg-amber-50/10 dark:bg-amber-500/10">
        <div className="flex items-start gap-2">
          <AlertTriangle
            className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <div className="text-xs text-amber-800 dark:text-amber-200">
            <p className="font-medium">This card could not be displayed.</p>
            <p className="mt-0.5 opacity-80">
              The rest of the conversation is unaffected. Details are in the browser
              console.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default CardErrorBoundary;
