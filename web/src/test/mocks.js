/**
 * Mock data que simula la respuesta de /api/avatar/spec
 */
export const mockSpec = {
  parts: {
    top: "HairType",
    eyebrows: "EyebrowType",
    eyes: "EyeType",
    mouth: "MouthType",
    facial_hair: "FacialHairType",
    skin_color: "SkinColor",
    hair_color: "HairColor",
    facial_hair_color: "HairColor",
  },
  groups: {
    facial_features: ["eyebrows", "eyes", "mouth", "skin_color"],
    hair: ["top", "hair_color", "facial_hair", "facial_hair_color"],
  },
  exclusions: {
    facial_hair_color: { part: "facial_hair", key: "NONE" },
    hair_color: { part: "top", key: "NONE" },
  },
  values: {
    HairType: { NONE: "NONE", BUN: "BUN", FRIZZLE: "FRIZZLE" },
    EyebrowType: { DEFAULT: "DEFAULT", UP_DOWN: "UP_DOWN" },
    EyeType: { DEFAULT: "DEFAULT", CRY: "CRY", SURPRISED: "SURPRISED" },
    MouthType: { DEFAULT: "DEFAULT", SMILE: "SMILE", SAD: "SAD" },
    FacialHairType: { NONE: "NONE", BEARD_LIGHT: "BEARD_LIGHT" },
    SkinColor: { LIGHT: "#FBD2C7", DARK: "#614335" },
    HairColor: { BLACK: "#262E33", BLONDE: "#F59797" },
  },
};

export const mockGalleryItems = [
  {
    id: "abc123",
    name: "Avatar Test",
    params: "eyes=DEFAULT&mouth=SMILE",
    created_at: "2026-04-25T12:00:00+00:00",
  },
  {
    id: "def456",
    name: "Avatar Dos",
    params: "eyes=CRY&mouth=SAD",
    created_at: "2026-04-24T10:00:00+00:00",
  },
];
