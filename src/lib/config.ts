// Branding pulled from env so a single image of the app can serve any gym.
export const gymConfig = {
  name: process.env.GYM_NAME ?? "My Gym",
  address: process.env.GYM_ADDRESS ?? "",
  phone: process.env.GYM_PHONE ?? "",
};
