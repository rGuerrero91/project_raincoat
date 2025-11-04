declare module 'weather-icons-react' {
  import { FC, SVGProps } from 'react';

  interface WeatherIconProps extends SVGProps<SVGSVGElement> {
    size?: number;
    color?: string;
  }

  export const WiDaySunnyOvercast: FC<WeatherIconProps>;
  export const WiDaySunny: FC<WeatherIconProps>;
  export const WiCloudy: FC<WeatherIconProps>;
  export const WiDayCloudy: FC<WeatherIconProps>;
  export const WiRain: FC<WeatherIconProps>;
  export const WiSnow: FC<WeatherIconProps>;
  export const WiThunderstorm: FC<WeatherIconProps>;
  export const WiFog: FC<WeatherIconProps>;
  // Add other icon exports as needed
}
