import React from 'react';
import Dropzone from 'react-dropzone';
import FileSaver from 'file-saver';
import JSZip from 'jszip';
import _ from 'lodash';

export default React.createClass({

   getInitialState() {
      return {
         file: null,
         fileContents: {},
         authors: [],
      };
   },

   onDrop(files = []) {
      this.setState({ file: files[0] }, this.unzip);
   },

   unzip() {
      JSZip.loadAsync(this.state.file)
         .then((zip) => {
            this.setState({ zip });

            const relevantFiles = _.filter(zip.files, file => file.name.endsWith('.xml'));
            const promises = relevantFiles.map(file => file.async('string'));

            return Promise.all(promises)
               .then((contents) => {
                  const authors = {};
                  _.each(contents, (content) => {
                     const regex = /w:author="(.*?)"/g;
                     let matches;
                     while (matches = regex.exec(content)) { // eslint-disable-line no-cond-assign
                        authors[matches[1]] = true;
                     }
                  });
                  this.setState({
                     authors: _.keys(authors),
                     fileContents: _.zipObject(_.map(relevantFiles, 'name'), contents),
                  });
               });
         })
         .catch((error) => {
            this.setState({ error });
         });
   },

   editAndDownload(e) {
      e.preventDefault();

      const zip = this.state.zip;
      const pattern = new RegExp(this.refs.name.value, 'g');
      const substitute = this.refs.substitute.value;

      _.each(this.state.fileContents, (content, path) => {
         zip.file(path, content.replace(pattern, substitute));
      });

      zip.generateAsync({ type: 'blob' })
         .then(blob => FileSaver.saveAs(blob, `EDITED ${this.state.file.name}`));
   },

   renderForm() {
      return (
         <div className="cell cell-6">
            <form className="form" onSubmit={this.editAndDownload}>
               <label className="form-group">
                  <select ref="name" className="form-control">
                     {this.state.authors.map(name => <option key={name}>{name}</option>)}
                  </select>
                  <span className="form-label">CURRENT AUTHORS</span>
               </label>
               <label className="form-group">
                  <input ref="substitute" type="text" placeholder="new name" className="form-control" />
                  <span className="form-label">SUBSTITUTE</span>
               </label>
               <button className="btn btn-primary btn-block" type="submit">Edit Comment Author</button>
            </form>
         </div>
      );
   },

   render() {
      if (this.state.error) {
         return (
            <pre className="container m-t-2 alert alert-error">
               {this.state.error.message}
            </pre>
         );
      }

      const style = {
         padding: '0 1rem',
         border: '2px dashed #e0e0e0',
         lineHeight: '166px',
         textAlign: 'center',
         color: '#bdbdbd',
      };

      const activeStyle = {
         ...style,
         backgroundColor: '#fafafa',
      };

      return (
         <div className="container">
            <header className="site-header dashed-bottom">
               <a href="/" className="site-title">Edit Word Commentator</a>
            </header>

            <main className="site-main grid">
               <div className={`cell ${this.state.file ? 'cell-6' : ''}`}>
                  <Dropzone
                     onDrop={this.onDrop}
                     multiple={false}
                     disablePreview
                     style={style}
                     activeStyle={activeStyle}
                     className="truncate"
                     accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  >
                     {this.state.file ? this.state.file.name : 'Drop Word Document'}
                  </Dropzone>
               </div>

               {this.state.file && this.renderForm()}
            </main>

            <footer className="site-footer dashed-top">
               Github: <a href="https://github.com/maxbeier/edit-word-commentator">edit-word-commentator</a>
            </footer>
         </div>
      );
   },

});
