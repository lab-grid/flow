import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { labflowOptions } from "./config";
import ReactGA from "react-ga";

export function useGoogleAnalytics() {
  useEffect(() => {
    if (labflowOptions.measurementId) {
      ReactGA.initialize(labflowOptions.measurementId);
    }
  }, []);
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (labflowOptions.measurementId) {
      ReactGA.pageview(location.pathname + location.search);
    }
  }, [location]);
};

export function useModalTracking(name?: string) {
  const location = useLocation();

  useEffect(() => {
    if (labflowOptions.measurementId) {
      ReactGA.modalview(name ? `${location.pathname}${location.search}#${name}` : `${location.pathname}${location.search}`);
    }
  }, [name, location]);
};
