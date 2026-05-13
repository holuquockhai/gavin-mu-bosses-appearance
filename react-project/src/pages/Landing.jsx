import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { markBossAsShowed, setAllChannelVisibility, setBosses, showChannelVisibility } from "../js/bossSlice";
import { setChannels } from "../js/channelSlice";
import BossTimerCard from "./components/BossTimerCard";
import PresetControlForm from "./components/PresetControlForm";
import { getBossesApi } from "../api/bossApi";
import { getChannelsApi } from "../api/channelApi";

function formatTimerBadge(endAt) {
  const seconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainSeconds = seconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(2, "0")}`;
}

const Landing = () => {
  const dispatch = useDispatch();
  const [isLoadingBosses, setIsLoadingBosses] = useState(true);
  const [bossError, setBossError] = useState("");
  const [channelError, setChannelError] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [, setTimerTick] = useState(0);

  // Load bosses redux store values
  const bosses = useSelector((state) => state.bosses.value);
  const channels = useSelector((state) => state.channels.value);
  const timers = useSelector((state) => state.bossCountdowns.value);

  useEffect(() => {
    let isMounted = true;

    const syncBosses = ({ showLoading = false } = {}) => {
      if (showLoading) {
        setIsLoadingBosses(true);
      }
      setBossError("");

      getBossesApi()
        .then((data) => {
          if (isMounted) {
            dispatch(setBosses(data));
          }
        })
        .catch((err) => {
          if (isMounted) {
            setBossError(err.response?.data?.detail || "Failed to load bosses");
          }
        })
        .finally(() => {
          if (isMounted && showLoading) {
            setIsLoadingBosses(false);
          }
        });
    };

    setIsLoadingBosses(true);
    syncBosses({ showLoading: true });

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    let isMounted = true;

    const syncChannels = () => {
      setChannelError("");

      getChannelsApi()
        .then((data) => {
          if (isMounted) {
            dispatch(setChannels(data));
          }
        })
        .catch((err) => {
          if (isMounted) {
            setChannelError(err.response?.data?.detail || "Failed to load channels");
            dispatch(setChannels([]));
          }
        });
    };

    setChannelError("");
    syncChannels();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!selectedChannel && channels.length > 0) {
      setSelectedChannel(channels[0].name);
    }
  }, [channels, selectedChannel]);

  useEffect(() => {
    if (selectedChannel) {
      dispatch(showChannelVisibility(selectedChannel));
    }
  }, [bosses.length, dispatch, selectedChannel]);

  useEffect(() => {
    if (channels.length > 0) {
      dispatch(setAllChannelVisibility({ channels: channels.map((channel) => channel.name) }));
    }
  }, [channels, dispatch]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimerTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const getBossTimerForSelectedChannel = (bossId) => (
    timers.find((timer) => timer.bossId === bossId && timer.channel === selectedChannel)
  );

  return (
    <>
      <div className="homepage-stack">
        <section className="card border-0 shadow-sm unified boss-control-card">
          <div className="card-body">
            <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-3">
              <div>
                <h5 className="card-title mb-1">Boss Timer Setup</h5>
                <p className="small text-muted mb-0">Choose a channel, show the bosses you need, then set countdowns.</p>
              </div>

              <div className="channel-picker">
                <label className="form-label small text-muted mb-1" htmlFor="channelSelect">
                  Channel
                </label>
                <select
                  className="select form-select"
                  id="channelSelect"
                  title="Channel"
                  aria-label="Select channel"
                  value={selectedChannel}
                  onChange={(event) => setSelectedChannel(event.target.value)}
                >
                  <option value="">Select channel</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.name}>
                      {channel.name}
                    </option>
                  ))}
                </select>
                {channelError && <div className="small text-danger mt-1">{channelError}</div>}
              </div>
            </div>

            <div className="boss-toggle-panel">
              <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                <h6 className="mb-0">Show / Hide Boss Cards</h6>
                <span className="small text-muted">Shown on all channels</span>
              </div>
              <div className="chips d-flex flex-wrap gap-2" id="visChips">
                {isLoadingBosses && (
                  <span className="small text-muted">Loading bosses...</span>
                )}

                {!isLoadingBosses && bossError && (
                  <div className="alert alert-danger mb-0 w-100">{bossError}</div>
                )}

                {!isLoadingBosses && !bossError && bosses.length === 0 && (
                  <span className="small text-muted">No bosses found.</span>
                )}

                {!isLoadingBosses && !bossError && bosses.map((boss) => (
                  <div className="form-check form-switch boss-toggle-chip" key={boss.id}>
                    {(() => {
                      const channelTimer = getBossTimerForSelectedChannel(boss.id);

                      return (
                        <>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={`switchCheck-${boss.name}`}
                            checked={boss.isShowed}
                            onChange={() => dispatch(markBossAsShowed({
                              bossId: boss.id,
                              channels: channels.map((channel) => channel.name),
                            }))}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`switchCheck-${boss.name}`}
                          >
                            {boss.name}
                          </label>
                          <span className={`boss-toggle-countdown ${channelTimer ? "" : "is-empty"}`}>
                            {channelTimer ? formatTimerBadge(channelTimer.endAt) : "00:00:00"}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>

            <div className="preset-panel mt-3 pt-3 border-top">
              <PresetControlForm selectedChannel={selectedChannel} />
            </div>
          </div>
        </section>

        <div className="boss-card-grid">
          {bosses.filter((boss) => boss.isShowed).map((boss) => (
            <BossTimerCard key={boss.id} boss={boss} selectedChannel={selectedChannel} />
          ))}
        </div>
      </div>
    </>
  );
};

export default Landing;
