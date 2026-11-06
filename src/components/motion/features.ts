// The animation features the site uses (animate, variants, exit, hover / tap / focus and
// in-view), loaded by MotionProvider after the page has started, so they stay out of the first
// download. Drag and layout animations (domMax) aren't used anywhere.
import { domAnimation } from "motion/react";

export default domAnimation;
