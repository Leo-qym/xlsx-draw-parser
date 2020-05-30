import { xlsxStore } from 'stores/xlsxStore';

export function matchUpsIntegrity({matchUps}) {
  const sideCheck = matchUps.reduce((check, matchUp) => {
    return matchUp.winningSide.length && matchUp.losingSide.length && check;
  }, true);
  if (!sideCheck) {
    setTimeout(() => {
      xlsxStore.dispatch({
        type: 'toaster state',
        payload: {
          severity: 'error',
          message: `Matches missing Players`,
        }
      });
    }, 800);
  }
}