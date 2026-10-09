import './fonts.ts';
import './styles/main.css';
import { App } from './ui/app.ts';
import { restoreSave } from './game/save.ts';

await restoreSave();
new App(document.getElementById('app')!);
