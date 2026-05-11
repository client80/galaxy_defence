import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../utils/constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  public preload(): void {
    // 이미지를 변수로 관리하여 나중에 교체 가능하게 구성
    // 파일이 없더라도 Phaser가 기본 모양이나 오류 없이 처리하도록 예외 상황 무시 설정
    // 실제 이미지를 넣으면 활성화할 수 있습니다.
    /*
    this.load.image('bg', ASSETS.background);
    this.load.image('deathStar', ASSETS.deathStar);
    */
  }

  public create(): void {
    // 1. 어두운 우주 배경
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.createStarField();

    // 2. 거대 요새 (Death Star 느낌) 그리기
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2 - 50;

    // 거대한 행성 배경
    this.add.circle(centerX + 150, centerY - 150, 250, 0x111111)
      .setStrokeStyle(4, 0x333333, 0.5)
      .setDepth(1);
    
    // Death Star 크레이터
    this.add.circle(centerX + 80, centerY - 200, 60, 0x0a0a0a)
      .setStrokeStyle(2, 0x222222, 0.5)
      .setDepth(1);

    // 화려한 광원 효과 (네온 레이저 느낌)
    const glow = this.add.circle(centerX, centerY - 50, 300, 0x7df9ff, 0.05).setDepth(0);
    this.tweens.add({
      targets: glow,
      alpha: 0.15,
      scale: 1.1,
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    // 3. 타이틀 텍스트
    this.add.text(centerX, centerY - 50, 'GALAXY DEFENCE', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '64px',
      color: '#ffffff',
      stroke: '#7df9ff',
      strokeThickness: 6,
      shadow: { color: '#7df9ff', fill: true, offsetX: 0, offsetY: 0, blur: 20 }
    }).setOrigin(0.5).setDepth(2);

    // 4. Press Space to Start 텍스트
    const startText = this.add.text(centerX, centerY + 100, 'Press Space to Start', {
      fontFamily: 'Consolas, ui-monospace, monospace',
      fontSize: '24px',
      color: '#fff07a',
    }).setOrigin(0.5).setDepth(2);

    // 깜빡임 효과
    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 스페이스바 입력 대기
    const keyboard = this.input.keyboard;
    if (keyboard) {
      const spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      spaceKey.once('down', () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene');
        });
      });
    }
  }

  private createStarField(): void {
    for (let index = 0; index < 150; index += 1) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.9);

      this.add.rectangle(x, y, size, size, COLORS.star, alpha).setDepth(0);
    }
  }
}
