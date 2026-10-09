import { Icon, type AnyIconName } from "@/components/ui/Icon";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";

// Numbered steps without photos: a round icon badge with its step number, the title and a line
// of text. On laptops the steps sit in a row joined by a thin line; on phones they stack as a
// timeline. They arrive in a wave like the other lists on the site.
export function StepFlow({ steps, icons }: { steps: readonly { title: string; text: string }[]; icons: readonly AnyIconName[] }) {
  return (
    // On laptops the list's ::before draws the line joining the badges, from the centre of the
    // first column to the centre of the last (a pseudo-element, since a list may only hold items).
    <StaggerList className="relative grid gap-8 md:grid-cols-3 md:gap-10 md:before:absolute md:before:left-[16.67%] md:before:right-[16.67%] md:before:top-8 md:before:h-px md:before:bg-peach md:before:content-['']">
      {steps.map((s, i) => (
        <StaggerItem key={s.title} className="relative flex gap-5 md:flex-col md:items-center md:text-center">
          {/* On phones, a line runs down from each badge to the next one. */}
          {i < steps.length - 1 && <span aria-hidden className="absolute left-8 top-16 h-[calc(100%-2rem)] w-px bg-peach md:hidden" />}
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-line bg-peach/60">
            <Icon name={icons[i]} className="h-7 w-7 text-brand" strokeWidth={1.5} />
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-medium text-white">
              {i + 1}
            </span>
          </span>
          <span className="md:mt-2">
            <span className="block text-xl font-medium text-ink">{s.title}</span>
            <span className="mt-2 block text-body md:mx-auto md:max-w-xs">{s.text}</span>
          </span>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
