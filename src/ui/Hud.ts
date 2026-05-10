import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH, HUD_FONT_SIZE, HUD_TOP } from '../utils/constants';
import type { HudValues } from '../utils/types';

const HUD_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: 'Consolas, ui-monospace, monospace',
  fontSize: `${HUD_FONT_SIZE}px`,
  color: '#e8fbff',
};

export class Hud {
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly stageText: Phaser.GameObjects.Text;
  private readonly centerText: Phaser.GameObjects.Text;

  // 점수, 기지 체력, 스테이지 정보를 화면 상단에 표시한다.
  constructor(scene: Phaser.Scene) {
    this.scoreText = scene.add.text(18, HUD_TOP, '', HUD_TEXT_STYLE).setDepth(10);
    this.hpText = scene.add.text(GAME_WIDTH / 2, HUD_TOP, '', HUD_TEXT_STYLE).setOrigin(0.5, 0).setDepth(10);
    this.stageText = scene.add.text(GAME_WIDTH - 18, HUD_TOP, '', HUD_TEXT_STYLE).setOrigin(1, 0).setDepth(10);
    this.centerText = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
        fontFamily: 'Consolas, ui-monospace, monospace',
        fontSize: '44px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);
  }

  public update(values: HudValues): void {
    this.scoreText.setText(`Score ${values.score}`);
    this.hpText.setText(`Base HP ${values.baseHp}`);
    this.stageText.setText(`Stage ${values.stage}`);
  }

  public showCenterMessage(message: string, color: string): void {
    this.centerText.setText(message);
    this.centerText.setColor(color);
    this.centerText.setVisible(true);
  }
}
