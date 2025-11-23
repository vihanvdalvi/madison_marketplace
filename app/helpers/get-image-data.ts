import { getPicDataFromTag, getPicDataFromId } from "./get-pic-ids";

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
  const data = await getPicDataFromTag(tags, inverse);
  data.forEach((element: any) => {
    let id = element.public_id;
    let picture = element.url;
    let width = element.width;
    let height = element.height;
    let caption =
      element.context.caption != null ? element.context.caption : "";
    let description = element.context.alt != null ? element.context.alt : "";
    let price = element.context.price != null ? element.context.price : "";
    let userEmail =
      element.context.userEmail != null ? element.context.userEmail : "";
    let data = {
      id: id,
      picture: picture,
      width: width,
      height: height,
      caption: caption,
      description: description,
      price: price,
      userEmail: userEmail,
    };
    picData.push(data);
  });
  return picData;
};

export const getDataFromId = async (id: string) => {
  let element: any = await getPicDataFromId(id);
  console.log("element: ", element);
  let picData: {
    id: any;
    picture: any;
    width: any;
    height: any;
    caption: any;
    description: any;
    price: any;
    userEmail: any;
  } = {
    id: element.public_id,
    picture: element.url,
    width: element.width,
    height: element.height,
    caption: element.context.caption != null ? element.context.caption : "",
    description: element.context.alt != null ? element.context.alt : "",
    price: element.context.price != null ? element.context.price : "",
    userEmail:
      element.context.userEmail != null ? element.context.userEmail : "",
  };
  return picData;
};
