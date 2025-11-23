import { db } from "./firebase";
import cloudinary from "./cloudinary";

export default async function setSold(itemId: string) {
  try {
    console.log(itemId);
    await db.collection("price-directory").doc(itemId).update({ sold: true });
    await cloudinary.v2.uploader
      .add_tag("sold", [`madison-marketplace/${itemId}`])
      .then((result) => {
        console.log("Tag added successfully:", result);
      })
      .catch((error) => {
        console.error("Error adding tag:", error);
      });
  } catch (error) {
    console.error("Error setting item as sold:", error);
  }
}
