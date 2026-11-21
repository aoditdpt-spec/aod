// The artist's profile and work answers as the server keeps them (src/server/actions/artist.ts) and the
// portal's live data carries them (src/lib/artist-live.ts). Types only.

// An artist's `details`: date of birth (`dob`), area (`locality`), their main kind of artist (`kind`),
// other kinds (`other`), the declaration (`agree`), and each kind's work answers by
// "<kind>.<question id>" (src/data/work-questions.ts): a string for one choice or typed text, a list for several.
export type WorkDetails = Record<string, string | string[]>;

export type ArtistProfile = {
  fullName: string;
  phone: string;
  email: string;
  dob?: string; // date of birth, yyyy-mm-dd
  city: string;
  locality?: string; // the area of the city, e.g. "Bopal"
  category: string; // main category slug (src/data/site.ts)
  otherCategories: string[]; // other categories they also work in
  services: string[];
  experience: string;
  languages: string[];
  bio: string;
  links: string[];
  photo: string; // "<Drive file id>~<version>" on AOD's Google Drive, or "" for none
  work?: WorkDetails;
  agreeTerms: boolean;
};
