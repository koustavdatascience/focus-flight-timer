// Design philosophy: Cloud Atlas Editorial — a calm, cartographic focus ritual with tactile controls.
import { TooltipProvider } from "@/components/ui/tooltip";
import { SeoMeta } from "@/components/SeoMeta";
import { Analytics } from "@vercel/analytics/react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import CoFocus from "./pages/CoFocus";
import About from "./pages/About";
import Changelog from "./pages/Changelog";
import Feedback from "./pages/Feedback";
import Home from "./pages/Home";
import Journey from "./pages/Journey";
import { Privacy, Terms } from "./pages/Legal";
import Leaderboards from "./pages/Leaderboards";
import Guides from "./pages/Guides";
import NotFound from "./pages/NotFound";
import PublicProfile from "./pages/PublicProfile";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <SeoMeta />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/journey" component={Journey} />
        <Route path="/cofocus" component={CoFocus} />
        <Route path="/leaderboards" component={Leaderboards} />
        <Route path="/about" component={About} />
        <Route path="/guides" component={Guides} />
        <Route path="/guides/:slug" component={Guides} />
        <Route path="/changelog" component={Changelog} />
        <Route path="/feedback" component={Feedback} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/u/:handle" component={PublicProfile} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Router />
          <Analytics />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
