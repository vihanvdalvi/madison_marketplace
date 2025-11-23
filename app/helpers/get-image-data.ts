import { getPicIds } from "./get-pic-ids";

export const getData = async (tags: String[], inverse: boolean = false) => {
  let picData: {
    id: any;
    picture: any;
    width: any;
    height: any;
    caption: any;
    description: any;
    price: any;
  }[] = [];
  const data = await getPicIds(tags, inverse);
  data.forEach((element: any) => {
    let id = element.public_id;
    let picture = element.url;
    let width = element.width;
    let height = element.height;
    let caption =
      element.context.caption != null ? element.context.caption : "";
    let description = element.context.alt != null ? element.context.alt : "";
    let price = element.context.price != null ? element.context.price : "";
    let data = {
      id: id,
      picture: picture,
      width: width,
      height: height,
      caption: caption,
      description: description,
      price: price,
    };
    picData.push(data);
  });
  return picData;
};
