export class NodeMeasurementHelper {
  appendChild(dom: HTMLElement) {
    const tempContainer = this.createTempContainer();
    tempContainer.innerHTML = ''; // Clear previous content
    tempContainer.appendChild(dom);

    return dom;
  }

  private createTempContainer() {
    let tempContainer = document.getElementById('pm-pagination-measure');
    if (!tempContainer) {
      tempContainer = document.createElement('div');
      tempContainer.id = 'pm-pagination-measure';
      tempContainer.className = 'ProseMirror';
      tempContainer.contentEditable = 'true';
      /* A4 MARGIN */
      tempContainer.style.cssText = `
            position: absolute;
            visibility: hidden;
            top: -100%;
            left: -100%;
            box-sizing: border-box;
            z-index: -1;
            overflow: hidden;
        `;
      document.body.appendChild(tempContainer);
    }

    return tempContainer;
  }
}
