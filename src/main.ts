import { SceneManager } from './engine/SceneManager';
import { GameLoop } from './engine/GameLoop';
import './style.css';

const app = document.getElementById('app');

if (app) {
  const sceneManager = new SceneManager(app);
  const gameLoop = new GameLoop(sceneManager);
  gameLoop.start();
}
