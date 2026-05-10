import { defineConfig } from 'vite';

export default defineConfig({
  // Cloudflare Pages 루트 배포에서 Vite 빌드 산출물이 절대 경로로 로드되도록 고정한다.
  base: '/',
});
