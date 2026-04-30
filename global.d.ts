/**
 * @fileoverview Global declarations for importing image assets.
 * This file tells TypeScript that image files such as .jpg, .jpeg, and .png should be treated as strings.
 * This ensures that imports from these files have a string type, which is assignable to React.Key.
 */

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

/**
 * @fileoverview Provides module declarations for importing SVG files as React components.
 */
declare module "*.svg" {
  import React from "react";
  /** 
   * React Functional Component for the imported SVG.
   */
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
} 