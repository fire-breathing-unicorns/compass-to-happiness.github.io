import { createContext, useContext, useEffect, useState } from 'react';

/***
 * Start listening for compass events.
 *
 * @param setBearing Accepts a single parameter in the range 0.0-360.0, called when a new bearing is available.
 * @returns Error message if compass failed to start, or null.
 */
async function startCompassListening({ setBearing }) {
  if (!window.DeviceOrientationEvent) {
    return 'DeviceOrientationEvent is not supported in this browser.';
  }

  if (window.ondeviceorientation === undefined && window.ondeviceorientationabsolute === undefined) {
    return 'Device orientation events might not be supported in this browser.';
  }

  // Request permission if necessary (iOS 13+)
  if (DeviceOrientationEvent.requestPermission) {
    const response = await DeviceOrientationEvent.requestPermission();
    if (response !== 'granted') {
      return 'Permission was denied by the user.';
    }
  }

  // Promise resolves the error message if compass failed to start, or null.
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  setTimeout(() => {
    resolvePromise('Failed to start compass after one second.');
  }, 1000);

  const handler = (ev) => {
    // Check that bearing exists.
    if (ev.webkitCompassHeading == null && ev.alpha == null) {
      resolvePromise('Compass heading not found in event.');
      return;
    }

    // Check that bearing is absolute.
    if (!ev.absolute) {
      resolvePromise('Compass results are relative to the device.');
      return;
    }

    // Successfully recieved orientation data.
    resolvePromise(null);

    // Report the received bearing.
    const bearing = ev.webkitCompassHeading || Math.abs(ev.alpha - 360);
    setBearing(-bearing);
  };

  // Add event listeners, prefer absolute orientation events.
  if (window.ondeviceorientationabsolute !== undefined) {
    window.addEventListener('deviceorientationabsolute', handler, true);
  } else {
    window.addEventListener('deviceorientation', handler, true);
  }

  return promise;
}

const CompassContext = createContext({
  bearing: -1,
  errorMessage: 'Loading...',
});

export const useCompass = () => useContext(CompassContext);

export const CompassProvider = ({ children }) => {
  const [bearing, setBearing] = useState(-1);
  const [errorMessage, setErrorMessage] = useState('Loading...');

  useEffect(() => {
    startCompassListening({ setBearing }).then((error) => {
      setErrorMessage(error);
    });
  }, []);

  return <CompassContext.Provider value={{ bearing, errorMessage }} children={children} />;
};
