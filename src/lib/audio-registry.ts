"use client";

/**
 * Global registry of the app's HTMLAudioElement so subsystems
 * (like the listen-together sync engine) can fine-tune playback
 * without prop drilling through React.
 */

let instance: HTMLAudioElement | null = null;

export function registerAudioElement(audio: HTMLAudioElement): void {
  instance = audio;
}

export function unregisterAudioElement(audio: HTMLAudioElement): void {
  if (instance === audio) instance = null;
}

export function getAudioElement(): HTMLAudioElement | null {
  return instance;
}
