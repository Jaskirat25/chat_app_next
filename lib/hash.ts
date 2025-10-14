import bcrypt from "bcryptjs";
export default async function Hash(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      throw new Error(error.message);
    }
    throw new Error("Unknown error occurred during hashing.");
  }
}


