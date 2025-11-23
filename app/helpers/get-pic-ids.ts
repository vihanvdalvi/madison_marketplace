import cloudinary from "./cloudinary";
import { cache } from "react";
export const getPicIds = cache(
  async (tags: String[], inverse: boolean = false) => {
    let tags_str = "";
    if (inverse) {
      tags_str += "NOT (";
    }
    for (const tag of tags) {
      tags_str += `tags:${tag} OR `;
    }
    if (inverse) {
      tags_str = tags_str.slice(0, -4); // remove last ' OR '
      tags_str += ")";
    } else {
      tags_str = tags_str.slice(0, -4); // remove last ' OR '
    }
    let results = await cloudinary.v2.search
      .expression(`folder:madison-marketplace/* AND (${tags_str})`)
      .with_field("context")
      .execute();
    return results.resources;
  }
);
