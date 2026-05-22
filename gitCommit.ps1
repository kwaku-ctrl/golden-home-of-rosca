Set-Location 'C:\Users\kb626\OneDrive\Desktop\GHOR'
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Output 'GIT_NOT_FOUND'
    exit 1
}
Write-Output 'GIT_FOUND'
git status --short
if ((git diff --cached --quiet) -ne $true) {
    git commit -m 'Commit all current workspace changes'
    Write-Output 'COMMITTED'
} else {
    Write-Output 'NO_STAGED_CHANGES'
}
git push origin main
Write-Output 'PUSH_DONE'
