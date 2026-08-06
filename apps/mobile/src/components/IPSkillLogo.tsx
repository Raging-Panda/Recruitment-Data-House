import React from "react";
import { Image } from "react-native";

export function IPSkillLogo({ size = 96 }: { size?: number }) {
  return (
    <Image
      source={require("../../assets/icon.png")}
      style={{ width: size, height: size, resizeMode: "contain" }}
    />
  );
}
