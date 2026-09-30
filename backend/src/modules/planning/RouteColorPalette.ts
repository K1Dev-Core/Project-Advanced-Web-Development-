export interface RouteColor {
  hex: string;
  name: string;
}

export class RouteColorPalette {
  private static readonly COLORS: RouteColor[] = [
    { hex: "#E53935", name: "แดง" },
    { hex: "#43A047", name: "เขียว" },
    { hex: "#1E88E5", name: "น้ำเงิน" },
    { hex: "#FB8C00", name: "ส้ม" },
    { hex: "#8E24AA", name: "ม่วง" },
    { hex: "#00ACC1", name: "ฟ้า" },
    { hex: "#D81B60", name: "ชมพู" },
    { hex: "#6D4C41", name: "น้ำตาล" },
    { hex: "#3949AB", name: "คราม" },
    { hex: "#7CB342", name: "เขียวอ่อน" },
    { hex: "#FDD835", name: "เหลือง" },
    { hex: "#546E7A", name: "เทา" },
    { hex: "#F4511E", name: "ส้มแดง" },
    { hex: "#00897B", name: "เขียวหัวเป็ด" },
    { hex: "#5E35B1", name: "ม่วงเข้ม" },
    { hex: "#C0CA33", name: "เขียวมะนาว" },
  ];

  static at(index: number): RouteColor {
    return RouteColorPalette.COLORS[index % RouteColorPalette.COLORS.length];
  }
}
