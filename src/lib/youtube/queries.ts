export const youtubeQueries = {
  channel: "youtube/v3/channels?part=snippet,statistics",
  views: "youtubeAnalytics/v2/reports?metrics=views",
  watchTime: "youtubeAnalytics/v2/reports?metrics=estimatedMinutesWatched",
  avgViewDuration: "youtubeAnalytics/v2/reports?metrics=averageViewDuration",
  countries: "youtubeAnalytics/v2/reports?dimensions=country&metrics=views",
  ageGroups: "youtubeAnalytics/v2/reports?dimensions=ageGroup&metrics=viewerPercentage",
};
