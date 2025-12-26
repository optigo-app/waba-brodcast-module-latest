import * as confetti from "canvas-confetti";

export const useConfetti = () => {
  const triggerConfetti = () => {
    const canvas = document.getElementById("confetti");
    const confettiInstance = confetti.create(canvas || undefined, {
      resize: true,
      useWorker: true,
    });

    // Left side confetti
    confettiInstance({
      particleCount: 100,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      startVelocity: 50,
      gravity: 1.5,
      colors: ["#ff0000", "#ff8c00", "#ffd700", "#008000", "#0000ff", "#4b0082", "#ee82ee"],
      zIndex: 9999,
    });

    // Right side confetti
    confettiInstance({
      particleCount: 100,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      startVelocity: 50,
      gravity: 1.5,
      colors: ["#ff0000", "#ff8c00", "#ffd700", "#008000", "#0000ff", "#4b0082", "#ee82ee"],
      zIndex: 9999,
    });

    // Center burst for extra effect
    confettiInstance({
      particleCount: 50,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      startVelocity: 30,
      gravity: 0.8,
      colors: ["#ff0000", "#ff8c00", "#ffd700", "#008000", "#0000ff", "#4b0082", "#ee82ee"],
      zIndex: 9999,
    });
  };

  return { triggerConfetti };
};
