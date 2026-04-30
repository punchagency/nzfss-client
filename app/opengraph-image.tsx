import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'NZFSS';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#ffffff',
          padding: '40px',
        }}
      >
        <img
          src="https://nzfss.s3.us-east-1.amazonaws.com/nzfss-logo.png"
          alt={alt}
          width={400}
          height={400}
          style={{
            objectFit: 'contain',
          }}
        />
        <div
          style={{
            fontSize: 60,
            fontWeight: 'bold',
            color: '#000000',
            marginTop: 20,
          }}
        >
          NZFSS
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
} 