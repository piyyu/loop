"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

/**
 * Login page — iPod-themed Spotify OAuth login.
 */
export default function LoginPage() {
  return (
    <div
      className="flex items-center justify-center min-h-screen select-none"
      style={{
        background: "linear-gradient(145deg, #E8E8ED, #D0D0D8)",
      }}
    >
      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* iPod body */}
        <div
          style={{
            background: "linear-gradient(145deg, #E8E8ED, #D8D8E0)",
            borderRadius: "32px",
            padding: "24px 20px 28px",
            boxShadow: `
              0 20px 60px rgba(0,0,0,0.25),
              0 0 0 1px rgba(0,0,0,0.08),
              inset 0 1px 0 rgba(255,255,255,0.2)
            `,
            width: "300px",
          }}
        >
          {/* Screen */}
          <div
            style={{
              background: "#2A2A2A",
              borderRadius: "8px",
              padding: "2px",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="flex flex-col items-center justify-center"
              style={{
                background: "#B8C9A3",
                borderRadius: "6px",
                minHeight: "200px",
                height: "auto",
                padding: "16px 20px",
                fontFamily: "'Chicago', 'SF Pro Text', system-ui",
              }}
            >
              {/* Loop logo */}
              <motion.div
                className="text-4xl mb-2"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                ∞
              </motion.div>

              <h1
                className="font-bold tracking-wider mb-1"
                style={{
                  fontSize: "18px",
                  color: "#1a1a1a",
                }}
              >
                Loop
              </h1>

              <p
                className="text-center mb-3"
                style={{
                  fontSize: "10px",
                  color: "#5A6A4A",
                  lineHeight: 1.4,
                }}
              >
                Sign in to access
                <br />
                your music library
              </p>

              <motion.button
                onClick={() => signIn("spotify", { callbackUrl: "/" }, { mock: "true" })}
                className="w-full py-2 px-4 rounded font-bold mt-2 flex items-center justify-center gap-2"
                style={{
                  background: "#1DB954",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontFamily: "Chicago, system-ui",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(29,185,84,0.3)",
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Sign In with Spotify"
              >
                Sign In with Spotify
              </motion.button>
            </div>
          </div>

          {/* Mini click wheel decoration */}
          <div className="flex justify-center mt-6">
            <div
              className="rounded-full"
              style={{
                width: "80px",
                height: "80px",
                background:
                  "radial-gradient(circle at 40% 35%, #F0F0F0, #E0E0E0, #D0D0D0)",
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: "30px",
                  height: "30px",
                  background:
                    "radial-gradient(circle at 40% 35%, #FFFFFF, #F5F5F5)",
                  boxShadow: "inset 0 1px 3px rgba(255,255,255,0.3)",
                }}
              />
            </div>
          </div>

          {/* Branding */}
          <div
            className="text-center mt-3"
            style={{
              color: "rgba(0,0,0,0.1)",
              fontSize: "9px",
              fontWeight: 500,
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            Loop
          </div>
        </div>
      </motion.div>
    </div>
  );
}
