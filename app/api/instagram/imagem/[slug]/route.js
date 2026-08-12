import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { getRascunho } from '../../../../../lib/instagram';
import { getImagemFundo } from '../../../../../lib/instagramImagens';
import { CLINIC_PHONE_DISPLAY_MATRIZ } from '../../../../../lib/config';

export const runtime = 'nodejs';

const TAMANHOS = {
  feed: { width: 1080, height: 1080 },
  stories: { width: 1080, height: 1920 },
};

const FUNDO_PADRAO = 'linear-gradient(160deg, #33914a 0%, #2b7a3e 45%, #174022 100%)';

let logoDataUriCache = null;

async function getLogoDataUri() {
  if (!logoDataUriCache) {
    const buffer = await readFile(join(process.cwd(), 'public', 'logo.png'));
    logoDataUriCache = `data:image/png;base64,${buffer.toString('base64')}`;
  }
  return logoDataUriCache;
}

export async function GET(request, { params }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const formato = searchParams.get('formato') === 'stories' ? 'stories' : 'feed';
  const { width, height } = TAMANHOS[formato];

  const rascunho = await getRascunho(slug);
  if (!rascunho) {
    return new Response('Rascunho não encontrado.', { status: 404 });
  }

  const [logo, fundo] = await Promise.all([getLogoDataUri(), getImagemFundo(slug, formato)]);
  const fundoDataUri = fundo ? `data:${fundo.mimeType};base64,${fundo.data}` : null;

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          background: fundoDataUri ? '#174022' : FUNDO_PADRAO,
        }}
      >
        {fundoDataUri && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fundoDataUri}
            alt=""
            width={width}
            height={height}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            background:
              'linear-gradient(180deg, rgba(23,64,34,0) 38%, rgba(23,64,34,0.6) 68%, rgba(23,64,34,0.94) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 70,
            left: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            width={150}
            height={150}
            alt=""
            style={{ borderRadius: '9999px', background: '#ffffff', padding: '18px' }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0 90px 80px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: '#8cc63f',
            }}
          >
            Clin+Saúde
          </div>
          <div
            style={{
              marginTop: 22,
              fontSize: formato === 'stories' ? 62 : 54,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.25,
            }}
          >
            {rascunho.tema}
          </div>
          <div
            style={{
              marginTop: 30,
              width: 110,
              height: 4,
              display: 'flex',
              background: 'rgba(255,255,255,0.5)',
            }}
          />
          <div
            style={{
              marginTop: 26,
              fontSize: 28,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            @clinmaissaude_se · {CLINIC_PHONE_DISPLAY_MATRIZ}
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      headers: { 'Cache-Control': 'public, max-age=3600' },
    }
  );
}
