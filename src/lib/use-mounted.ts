import { useSyncExternalStore } from "react";

const noop = () => () => {};

// False on the server and while hydrating, true after: for things that need `document`, such as
// portals into <body>.
export function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
